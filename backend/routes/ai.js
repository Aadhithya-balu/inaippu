const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { requireAuth } = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/chat', requireAuth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful e-governance assistant named Inaippu AI. You help citizens understand government services, track their applications, file grievances, and navigate local policies. Always be polite, concise, and accurate.'
        },
        { role: 'user', content: prompt }
      ]
    });
    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI Error:', error.message);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

module.exports = router;
