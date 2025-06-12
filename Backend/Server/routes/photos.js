// routes/photos.js
const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo'); // Adjust the path if needed

// GET /api/photos
router.get('/', async (req, res) => {
  console.log('[DEBUG] GET /api/photos - Query:', req.query); // Debug log
  try {
    const { guestId } = req.query;
    let query = {};
    if (guestId) {
      query.guestId = guestId;
      console.log('[DEBUG] Filtering photos by guestId:', guestId); // Debug log
    }
    const photos = await Photo.find(query).sort({ createdAt: -1 });
    console.log(`[DEBUG] Found ${photos.length} photos`); // Debug log
    res.json(photos); // ✅ Must return an array
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to load photos' });
  }
});

// POST /api/reset-user-count
router.post('/reset-user-count', async (req, res) => {
  const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'Stormben1'; // Set this securely in production
  const { passcode } = req.body;

  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Invalid admin passcode' });
  }

  try {
    // TODO: Reset user count logic here (e.g., update DB, file, etc.)
    // For now, just log and return success
    console.log('Admin reset: user count reset');
    res.json({ message: 'User count has been reset. Photos remain in gallery.' });
  } catch (err) {
    console.error('Error resetting user count:', err);
    res.status(500).json({ error: 'Failed to reset user count' });
  }
});

module.exports = router;
