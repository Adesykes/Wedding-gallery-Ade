const express = require('express');
const jwt = require('jsonwebtoken');
const Photo = require('../models/Photo'); // ✅ Fixed path
const Wish = require('../models/Wish'); // Add Wish model
const router = express.Router();
const JSZip = require('jszip');
const axios = require('axios');
const { deleteImageKitFile } = require('../utils/imagekit');

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
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    // Attempt to delete from ImageKit if fileId exists
    if (photo.fileId) {
      try {
        await deleteImageKitFile(photo.fileId);
      } catch (err) {
        // Log but don't block DB deletion if ImageKit fails
        console.error('ImageKit delete error:', err.message);
      }
    }

    await Photo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Get all wishes with pagination
router.get('/wishes', verifyToken, async (req, res) => {
  try {
    // Parse pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Count total documents for pagination metadata
    const total = await Wish.countDocuments();
    
    // Fetch wishes with pagination
    const wishes = await Wish.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Send response with pagination metadata
    res.json({
      wishes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + wishes.length < total
      }
    });
  } catch (err) {
    console.error('Error fetching wishes:', err);
    res.status(500).json({ error: 'Failed to fetch wishes' });
  }
});

// Delete wish
router.delete('/wishes/:id', verifyToken, async (req, res) => {
  try {
    const wish = await Wish.findByIdAndDelete(req.params.id);
    
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    
    res.json({ success: true, message: 'Wish deleted successfully' });
  } catch (err) {
    console.error('Error deleting wish:', err);
    res.status(500).json({ error: 'Failed to delete wish' });
  }
});

// Download wishes as CSV
router.get('/download-wishes', verifyToken, async (req, res) => {
  try {
    const wishes = await Wish.find().sort({ createdAt: -1 });
    
    if (wishes.length === 0) {
      return res.status(404).json({ error: 'No wishes found to download' });
    }
    
    // Create CSV header
    let csv = 'Name,Message,Date\n';
    
    // Add each wish as a row in the CSV
    wishes.forEach(wish => {
      const name = wish.name.replace(/,/g, ' ').replace(/"/g, '""');
      const message = wish.message.replace(/,/g, ' ').replace(/"/g, '""').replace(/\n/g, ' ');
      const date = new Date(wish.createdAt).toLocaleString('en-GB');
      
      csv += `"${name}","${message}","${date}"\n`;
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="wedding-guestbook.csv"');
    
    // Send CSV data
    res.send(csv);
  } catch (err) {
    console.error('Error creating wishes CSV:', err);
    res.status(500).json({ error: 'Failed to download wishes' });
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
