const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  originalName: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

// ✅ Prevent model overwrite by checking if already compiled
module.exports = mongoose.models.Photo || mongoose.model('Photo', photoSchema);
