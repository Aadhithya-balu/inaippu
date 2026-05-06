const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/states', async (req, res) => {
  try {
    const { data, error } = await supabase.from('states').select('id, name').order('name');
    if (error) throw error;
    // Deduplicate by name, keep first occurrence
    const seen = new Set();
    const unique = data.filter(r => seen.has(r.name) ? false : seen.add(r.name));
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cities', async (req, res) => {
  const { state_id } = req.query;
  if (!state_id) return res.status(400).json({ error: 'state_id is required' });
  try {
    const { data, error } = await supabase.from('cities').select('id, name').eq('state_id', state_id).order('name');
    if (error) throw error;
    const seen = new Set();
    const unique = data.filter(r => seen.has(r.name) ? false : seen.add(r.name));
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/zones', async (req, res) => {
  const { city_id } = req.query;
  if (!city_id) return res.status(400).json({ error: 'city_id is required' });
  try {
    const { data, error } = await supabase.from('zones').select('id, name').eq('city_id', city_id).order('name');
    if (error) throw error;
    const seen = new Set();
    const unique = data.filter(r => seen.has(r.name) ? false : seen.add(r.name));
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
