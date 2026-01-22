require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express(); // ✅ IMPORTANT
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

/* ---------------- HEALTH CHECK ---------------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ---------------- SAMPLE PASSAGES API ---------------- */
app.get('/api/passages', (req, res) => {
  res.json([
    {
      "id": 1,
      "grade": "Grade 4",
      "title": "The Clever Rabbit",
      "passage": "Once upon a time, there was a clever rabbit who lived in the forest.",
      "questions": [
        {
          "type": "mcq",
          "question": "Where did the rabbit live?",
          "options": ["In a forest", "In a city", "On a mountain", "Near a river"],
          "answer": "In a forest"
        },
        {
          "type": "short",
          "question": "What animal is the main character?",
          "answer": "rabbit"
        }
      ]
    }
  ]); // ✅ Close the array AND the function properly
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
