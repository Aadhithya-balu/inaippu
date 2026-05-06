const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const supabase = require('../config/supabase');
const { autoAssignOfficer } = require('../utils/officerRouting');

router.get('/track/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        id, status, city, routing_note, resolution_notes,
        created_at, updated_at, resolved_at,
        complaint_types(name, department),
        officer:users!complaints_assigned_officer_id_fkey(name, department, city)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Complaint not found.' });

    const maskName = (name) => {
      if (!name) return 'Assigned Officer';
      return name.split(' ').map(w => w[0] + '*'.repeat(Math.max(w.length - 1, 0))).join(' ');
    };

    res.json({
      id: data.id,
      status: data.status,
      city: data.city,
      category: data.complaint_types?.name || 'General',
      department: data.complaint_types?.department || data.officer?.department || '—',
      resolution_notes: data.resolution_notes || null,
      submitted_at: data.created_at,
      updated_at: data.updated_at,
      resolved_at: data.resolved_at,
      assigned_to: maskName(data.officer?.name),
      officer_city: data.officer?.city || data.city,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/types', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('complaint_types')
      .select('id, name, department, schema')
      .order('name');
    if (error) throw error;

    const seen = new Set();
    const unique = data.filter(r => (seen.has(r.name) ? false : seen.add(r.name)));
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { type_id, dynamic_data, city } = req.body;

  if (!type_id || !dynamic_data) {
    return res.status(400).json({ error: 'type_id and dynamic_data are required.' });
  }

  try {
    const { data: typeRow, error: typeErr } = await supabase
      .from('complaint_types')
      .select('schema, department')
      .eq('id', type_id)
      .single();

    if (typeErr || !typeRow) return res.status(400).json({ error: 'Invalid complaint type.' });

    const missing = typeRow.schema
      .filter(f => f.required && !dynamic_data[f.key]?.toString().trim())
      .map(f => f.label);

    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const { officerId, routingNote } = await autoAssignOfficer(city, typeRow.department);

    const { data, error } = await supabase
      .from('complaints')
      .insert([{ user_id: req.user.id, type_id, dynamic_data, city, assigned_officer_id: officerId, routing_note: routingNote, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, routing_note: routingNote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase
      .from('complaints')
      .select(`
        *,
        complaint_types(name, department),
        citizen:users!complaints_user_id_fkey(name),
        officer:users!complaints_assigned_officer_id_fkey(name, department, city)
      `)
      .order('created_at', { ascending: false });

    if (req.user.role === 'citizen') query = query.eq('user_id', req.user.id);
    else if (req.user.role === 'officer') query = query.eq('assigned_officer_id', req.user.id);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', requireAuth, async (req, res) => {
  if (req.user.role !== 'officer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const { status, resolution_notes } = req.body;
  const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  try {
    const { data, error } = await supabase
      .from('complaints')
      .update({
        status,
        resolution_notes,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (status === 'resolved' || status === 'rejected') {
      await supabase.rpc('decrement_workload', { user_id: data.assigned_officer_id });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;