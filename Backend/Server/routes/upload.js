const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const Photo = require('../models/Photo');
const ImageKit = require('imagekit');

// Setup multer for temp file storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// POST /api/upload
router.post('/', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Validate file type
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  console.log('Mimetype:', req.file.mimetype);
  console.log('Size:', req.file.size);
  console.log('Original name:', req.file.originalname);

  try {
    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: '/wedding',
    });

    // Save to MongoDB
    const photo = new Photo({
      url: result.url,
      originalName: req.file.originalname,
      guestId: req.body.guestId || '',
    });
    await photo.save();

    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});
module.exports = router;
