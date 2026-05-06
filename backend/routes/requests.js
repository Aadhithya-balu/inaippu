const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const supabase = require('../config/supabase');
const { autoAssignOfficer } = require('../utils/officerRouting');

router.get('/sla', async (req, res) => {
  try {
    const { service_type } = req.query;
    let query = supabase.from('sla_config').select('sla_days, complaint_types(name, department)').order('created_at');

    const { data, error } = await query;
    if (error) throw error;

    if (!service_type) return res.json(data || []);

    const normalized = String(service_type).toLowerCase();
    const matched = (data || []).find(row => String(row.complaint_types?.name || '').toLowerCase().includes(normalized));
    res.json(matched ? [matched] : data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const sanitize = (val) => typeof val === 'string' ? val.replace(/<[^>]*>/g, '').trim() : val;

router.post('/', requireAuth, async (req, res) => {
  const title               = sanitize(req.body.title);
  const description         = sanitize(req.body.description);
  const category            = sanitize(req.body.category);
  const service_type        = sanitize(req.body.service_type);
  const location            = sanitize(req.body.location);
  const department          = sanitize(req.body.department);
  const image_url           = sanitize(req.body.image_url);
  const priority            = sanitize(req.body.priority) || 'medium';
  const assigned_officer_id = req.body.assigned_officer_id;

  if (!title)           return res.status(400).json({ error: 'Title is required.' });
  if (!description)     return res.status(400).json({ error: 'Description is required.' });
  if (!category || !['service', 'grievance'].includes(category))
    return res.status(400).json({ error: 'Invalid category.' });

  try {
    const routedOfficerId = assigned_officer_id || (await autoAssignOfficer(location, department)).officerId;
    const { data, error } = await supabase
      .from('requests')
      .insert([{ citizen_id: req.user.id, title, description, category, service_type, location, priority, assigned_officer_id: routedOfficerId, image_url, department, status: 'pending' }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('requests').select(`
      *,
      citizen:users!requests_citizen_id_fkey(name),
      officer:users!requests_assigned_officer_id_fkey(name, department, city)
    `);

    if (req.user.role === 'citizen')      query = query.eq('citizen_id', req.user.id);
    else if (req.user.role === 'officer') query = query.eq('assigned_officer_id', req.user.id);
    // admin sees all — no filter

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'officer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to update status' });
  }
  const status           = sanitize(req.body.status);
  const resolution_notes = sanitize(req.body.resolution_notes);

  const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status value.' });

  try {
    const { data, error } = await supabase
      .from('requests')
      .update({ status, resolution_notes, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
