const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const supabase = require('../config/supabase');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET = 'inaippu-documents';

// Mock virus scan — in production replace with ClamAV or cloud AV API
function mockVirusScan(buffer, filename) {
  // Reject files with suspicious patterns in name (demo only)
  const suspicious = ['.exe', '.sh', '.bat', '.js', '.php'];
  if (suspicious.some(ext => filename.toLowerCase().endsWith(ext))) {
    return { clean: false, reason: 'Suspicious file type detected.' };
  }
  return { clean: true };
}

// POST /api/documents/upload
// Expects multipart: handled via raw body since we use Supabase Storage directly
// Frontend sends: { base64, fileName, fileType, fileSize }
router.post('/upload', requireAuth, async (req, res) => {
  const { base64, fileName, fileType, fileSize } = req.body;

  if (!base64 || !fileName || !fileType)
    return res.status(400).json({ error: 'base64, fileName, and fileType are required.' });

  if (!ALLOWED_TYPES.includes(fileType))
    return res.status(400).json({ error: 'Only JPEG, PNG, WebP, and PDF files are allowed.' });

  if (fileSize > MAX_SIZE)
    return res.status(400).json({ error: 'File exceeds 5MB limit.' });

  // Decode base64
  const buffer = Buffer.from(base64, 'base64');

  // Mock virus scan
  const scan = mockVirusScan(buffer, fileName);
  if (!scan.clean)
    return res.status(400).json({ error: `File rejected: ${scan.reason}` });

  const ext = fileName.split('.').pop();
  const storagePath = `${req.user.id}/${Date.now()}.${ext}`;

  try {
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: fileType, upsert: false });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    // Save record to DB
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert([{ user_id: req.user.id, file_url: fileUrl, file_name: fileName, file_type: fileType, file_size: fileSize }])
      .select()
      .single();

    if (dbError) throw dbError;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents — list user's previously uploaded documents
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
