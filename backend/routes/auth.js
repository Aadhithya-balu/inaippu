const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const sanitize = (val) => typeof val === 'string' ? val.replace(/<[^>]*>/g, '').trim() : val;

router.post('/register', async (req, res) => {
  const aadhaarNumber = sanitize(req.body.aadhaarNumber);
  const password      = sanitize(req.body.password);
  const name          = sanitize(req.body.name);
  const city          = sanitize(req.body.city);
  const officerId     = sanitize(req.body.officerId);
  const department    = sanitize(req.body.department);
  const role          = sanitize(req.body.role) || 'citizen';

  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber))
    return res.status(400).json({ error: 'Aadhaar must be exactly 12 digits.' });
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (!city?.trim()) return res.status(400).json({ error: 'City is required.' });

  if (role === 'admin') {
    return res.status(403).json({ error: 'Admin accounts cannot be created via sign-up.' });
  }

  if (role === 'officer' && (!officerId || !department || !city)) {
     return res.status(400).json({ error: 'Officer ID, Department, and City are required for Officials.' });
  }
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('aadhaar_number', aadhaarNumber)
      .single();
      
    if (existingUser) {
        return res.status(400).json({error: 'A user with this Aadhaar number already exists'});
    }

    // Prepare user data
    const userData = { 
      aadhaar_number: aadhaarNumber, 
      password_hash: hashedPassword, 
      role, 
      name,
      city
    };

    if (role === 'officer') {
      userData.officer_id = officerId;
      userData.department = department;
      userData.verified = false; // Must be verified by admin
    } else if (role === 'citizen') {
      userData.verified = true; // Citizens are auto-verified
    }

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'User registered successfully', user: { id: data.id, role: data.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch filtered officers for grievance routing
router.get('/officers', async (req, res) => {
  const { city, department } = req.query;
  console.log(`[AUTH] Fetching officers for City: ${city}, Dept: ${department}`);
  try {
    let query = supabase.from('users').select('id, name, city, department, workload_count').eq('role', 'officer').eq('verified', true);
    
    if (city) query = query.eq('city', city);
    if (department) query = query.eq('department', department);

    query = query.order('workload_count', { ascending: true }).order('created_at', { ascending: true });

    const { data, error } = await query;
    if (error) {
      console.error("[AUTH] Supabase error:", error);
      throw error;
    }
    console.log(`[AUTH] Found ${data?.length || 0} officials matching criteria.`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const aadhaarNumber = req.body.aadhaarNumber?.trim();
  const password = req.body.password?.trim();

  if (!aadhaarNumber || !password) {
    return res.status(400).json({ error: 'Aadhaar number and password are required.' });
  }

  try {
    console.log(`[LOGIN] Attempt for Aadhaar: ${aadhaarNumber}`);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('aadhaar_number', aadhaarNumber)
      .single();

    if (error || !user) {
      console.log(`[LOGIN] User not found for: ${aadhaarNumber}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log(`[LOGIN] Password mismatch for user: ${aadhaarNumber}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log(`[LOGIN] Login successful for: ${aadhaarNumber} (${user.role})`);

    if (user.role === 'officer' && !user.verified) {
      return res.status(403).json({ error: 'Your account is pending verification by an administrator.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({ token, user: { id: user.id, role: user.role, name: user.name, city: user.city, department: user.department } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
