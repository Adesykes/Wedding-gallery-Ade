const express = require('express');
const jwt = require('jsonwebtoken');
const Photo = require('../models/Photo'); // ✅ Fixed path
const router = express.Router();
const JSZip = require('jszip');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Admin login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Get all photos
router.get('/photos', verifyToken, async (req, res) => {
  try {
    const photos = await Photo.find().sort({ uploadedAt: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Delete photo
router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await Photo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Photo not found' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Download ZIP
router.get('/download-zip', verifyToken, async (req, res) => {
  try {
    const photos = await Photo.find();
    const zip = new JSZip();

    const fetchPromises = photos.map(async (photo) => {
      try {
        const response = await axios.get(photo.url, {
          responseType: 'arraybuffer',
          timeout: 10000
        });

        const filename = (photo.originalName || `${photo._id}.jpg`).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
        zip.file(filename, response.data);
      } catch (err) {
        console.error(`⚠️ Failed to fetch ${photo.url}:`, err.message);
      }
    });

    await Promise.all(fetchPromises);

    const zipData = await zip.generateAsync({ type: 'nodebuffer' });
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="photos.zip"',
    });
    res.send(zipData);
  } catch (err) {
    console.error('❌ ZIP creation error:', err);
    res.status(500).json({ error: 'Failed to create ZIP' });
  }
});
// other route code...
module.exports = router;
