require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const uploadRoutes = require('./routes/upload');
const photosRoutes = require('./routes/photos');    // for /api/photos
const adminRoutes = require('./routes/admin');      // for /api/admin
const wishesRoutes = require('./routes/wishes');    // for /api/wishes

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'https://wedding-gallery-ade.vercel.app',
  credentials: true,
}));

// Static file serving for uploaded images (adjust if needed)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishes', wishesRoutes);

// --- PING ROUTE ---
app.get('/ping', (req, res) => {
  res.send('pong');
});

// --- SELF-PING INTERVAL ---
const SELF_PING_URL = 'https://wedding-gallery-ade-backend.onrender.com/ping';
setInterval(() => {
  axios.get(SELF_PING_URL)
    .then(() => console.log(`[Self-ping] Pinged ${SELF_PING_URL}`))
    .catch((err) => console.error(`[Self-ping] Failed:`, err.message));
}, 1000 * 60 * 5); // every 5 minutes

// 404 Handler (should be after all other routes)
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

module.exports = app;
