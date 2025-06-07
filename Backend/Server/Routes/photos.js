// routes/photos.js
const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo'); // Adjust the path if needed

// GET /api/photos
router.get('/', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });
    res.json(photos); // ✅ Must return an array
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to load photos' });
  }
});

module.exports = router;
