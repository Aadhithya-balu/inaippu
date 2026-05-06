const express = require('express');
const router = express.Router();
const { requireAuth, authorize } = require('../middleware/auth');
const supabase = require('../config/supabase');

const sanitize = (val) => typeof val === 'string' ? val.replace(/<[^>]*>/g, '').trim() : val;
const adminOnly = [requireAuth, authorize('admin')];

// ── STATS ────────────────────────────────────────────────────
router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const [
      { count: citizenCount },
      { count: officerCount },
      { count: reqPending },
      { count: reqResolved },
      { count: reqTotal },
      { count: cmpPending },
      { count: cmpResolved },
      { count: cmpTotal },
      { data: resolvedRows }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'citizen'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'officer').eq('verified', true),
      supabase.from('requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('requests').select('*', { count: 'exact', head: true }),
      supabase.from('complaints').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
      supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('complaints').select('*', { count: 'exact', head: true }),
      supabase.from('requests').select('created_at, resolved_at').eq('status', 'resolved').not('resolved_at', 'is', null)
    ]);

    const totalCount      = (reqTotal || 0) + (cmpTotal || 0);
    const resolvedCount   = (reqResolved || 0) + (cmpResolved || 0);
    const processingCount = (reqPending || 0) + (cmpPending || 0);

    let avgResponse = 'N/A';
    if (resolvedRows?.length) {
      const totalHours = resolvedRows.reduce((sum, r) => {
        return sum + (new Date(r.resolved_at) - new Date(r.created_at)) / 3600000;
      }, 0);
      avgResponse = (totalHours / resolvedRows.length).toFixed(1) + 'h';
    }

    res.json({
      citizenCount:    citizenCount || 0,
      officerCount:    officerCount || 0,
      processingCount,
      resolvedCount,
      totalCount,
      resolutionRate:  totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0,
      avgResponse,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ALL RECORDS (admin view) ────────────────────────────────
router.get('/records', ...adminOnly, async (req, res) => {
  try {
    // Fetch raw records
    const [{ data: requests, error: rErr }, { data: complaints, error: cErr }] = await Promise.all([
      supabase.from('requests').select('*').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
    ]);
    if (rErr) throw rErr;
    if (cErr) throw cErr;

    // Collect user ids to resolve (citizens and officers)
    const userIds = new Set();
    (requests || []).forEach(r => { if (r.citizen_id) userIds.add(r.citizen_id); if (r.assigned_officer_id) userIds.add(r.assigned_officer_id); });
    (complaints || []).forEach(c => { if (c.user_id) userIds.add(c.user_id); if (c.assigned_officer_id) userIds.add(c.assigned_officer_id); });

    const users = (userIds.size > 0)
      ? (await supabase.from('users').select('id, name, department, city, verified, workload_count').in('id', Array.from(userIds))).data
      : [];
    const userMap = (users || []).reduce((m, u) => { m[u.id] = u; return m; }, {});

    // Fetch complaint types map
    const { data: types } = await supabase.from('complaint_types').select('id, name, department');
    const typeMap = (types || []).reduce((m, t) => { m[t.id] = t; return m; }, {});

    // Attach resolved citizen/officer/type objects
    const resolvedRequests = (requests || []).map(r => ({
      ...r,
      citizen: userMap[r.citizen_id] || null,
      officer: userMap[r.assigned_officer_id] || null,
    }));

    const resolvedComplaints = (complaints || []).map(c => ({
      ...c,
      citizen: userMap[c.user_id] || null,
      officer: userMap[c.assigned_officer_id] || null,
      complaint_types: typeMap[c.type_id] || null,
    }));

    res.json({ requests: resolvedRequests || [], complaints: resolvedComplaints || [] });
  } catch (err) {
    console.error('Admin /records error:', err?.message || err);
    res.status(500).json({ error: err.message || 'Failed to load records.' });
  }
});

// ── ASSIGN complaint to officer ──────────────────────────────
router.put('/complaints/:id/assign', ...adminOnly, async (req, res) => {
  const { officer_id } = req.body;
  if (!officer_id) return res.status(400).json({ error: 'officer_id is required.' });
  try {
    const { data: current } = await supabase
      .from('complaints')
      .select('assigned_officer_id')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('complaints').update({ assigned_officer_id: officer_id })
      .eq('id', req.params.id).select().single();
    if (error) throw error;

    if (current?.assigned_officer_id && current.assigned_officer_id !== officer_id) {
      await supabase.rpc('decrement_workload', { user_id: current.assigned_officer_id });
    }
    if (current?.assigned_officer_id !== officer_id) {
      await supabase.rpc('increment_workload', { user_id: officer_id });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ASSIGN request to officer ────────────────────────────────
router.put('/requests/:id/assign', ...adminOnly, async (req, res) => {
  const { officer_id } = req.body;
  if (!officer_id) return res.status(400).json({ error: 'officer_id is required.' });
  try {
    const { data: current } = await supabase
      .from('requests')
      .select('assigned_officer_id')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('requests').update({ assigned_officer_id: officer_id })
      .eq('id', req.params.id).select().single();
    if (error) throw error;

    if (current?.assigned_officer_id && current.assigned_officer_id !== officer_id) {
      await supabase.rpc('decrement_workload', { user_id: current.assigned_officer_id });
    }
    if (current?.assigned_officer_id !== officer_id) {
      await supabase.rpc('increment_workload', { user_id: officer_id });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── USERS ────────────────────────────────────────────────────
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/verify', ...adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').update({ verified: true }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', ...adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public GET for departments (used in forms)
router.get('/departments/public', async (req, res) => {
  try {
    const { data, error } = await supabase.from('departments').select('id, name').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DEPARTMENTS ──────────────────────────────────────────────
router.get('/departments', ...adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/departments', ...adminOnly, async (req, res) => {
  const name = sanitize(req.body.name);
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  try {
    const { data, error } = await supabase.from('departments').insert([{ name }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/departments/:id', ...adminOnly, async (req, res) => {
  const name = sanitize(req.body.name);
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  try {
    const { data, error } = await supabase.from('departments').update({ name }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/departments/:id', ...adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('departments').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Department deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── COMPLAINT TYPES ──────────────────────────────────────────
router.get('/complaint-types', ...adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('complaint_types').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/complaint-types', ...adminOnly, async (req, res) => {
  const name       = sanitize(req.body.name);
  const department = sanitize(req.body.department);
  const schema     = req.body.schema;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!Array.isArray(schema)) return res.status(400).json({ error: 'Schema must be an array.' });
  try {
    const { data, error } = await supabase.from('complaint_types').insert([{ name, department, schema }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/complaint-types/:id', ...adminOnly, async (req, res) => {
  const name       = sanitize(req.body.name);
  const department = sanitize(req.body.department);
  const schema     = req.body.schema;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!Array.isArray(schema)) return res.status(400).json({ error: 'Schema must be an array.' });
  try {
    const { data, error } = await supabase.from('complaint_types').update({ name, department, schema }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/complaint-types/:id', ...adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('complaint_types').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Complaint type deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SLA CONFIG ───────────────────────────────────────────────
router.get('/sla', ...adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('sla_config').select('*, complaint_types(name)').order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sla', ...adminOnly, async (req, res) => {
  const { service_id, sla_days } = req.body;
  if (!service_id || !sla_days) return res.status(400).json({ error: 'service_id and sla_days are required.' });
  try {
    const { data, error } = await supabase
      .from('sla_config')
      .upsert([{ service_id, sla_days }], { onConflict: 'service_id' })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
