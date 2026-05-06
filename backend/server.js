require('dotenv').config();
const express = require('express');
const cors = require('cors');

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://69fb6ff8c0db7a8ba81b4855--inaippu.netlify.app').split(',');

const app = express();
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/requests'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/location', require('./routes/location'));
app.use('/api/documents', require('./routes/documents'));

app.get('/', (req, res) => {
  res.send('Inaippu Backend is running.');
});

// Keep-alive: ping self every 14 minutes to prevent Render free tier spin-down
if (process.env.NODE_ENV === 'production') {
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `https://inaippu-sr3w.onrender.com`;
  setInterval(() => {
    fetch(`${SELF_URL}/`).catch(() => {});
  }, 14 * 60 * 1000);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
