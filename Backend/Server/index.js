require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const uploadRoutes = require('./routes/upload');          // for /api/upload
const photosRoutes = require('./routes/photos');          // for /api/photos
const adminRoutes = require('./routes/admin');            // for /api/admin
const uploadRoute = require('./routes/upload');    // NEW: for /api/upload-b2

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/admin', adminRoutes);


// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// MongoDB + Start Server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
