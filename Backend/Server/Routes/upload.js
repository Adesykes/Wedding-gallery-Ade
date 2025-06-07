const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const Photo = require('../models/photo');
const ImageKit = require('imagekit');

// Setup multer for temp file storage
const upload = multer({ dest: 'temp/' });

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// POST /api/upload
router.post('/', upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const fileBuffer = fs.readFileSync(filePath);

  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: "wedding",  // Optional, helps organize photos
      useUniqueFileName: true
    });

    // Save photo info in MongoDB
    const photo = new Photo({
      url: result.url,
      createdAt: new Date(),
    });
    await photo.save();

    // Delete temp file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    res.json(photo);
  } catch (err) {
    console.error('ImageKit upload error:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

module.exports = router;
