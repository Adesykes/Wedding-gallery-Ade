const mongoose = require('mongoose');
const photoSchema = new mongoose.Schema({
  url: String,
  originalName: String,
  createdAt: { type: Date, default: Date.now },
  guestId: String,
  // ...other fields if needed...
});

// Prevent OverwriteModelError in dev/hot-reload
module.exports = mongoose.models.Photo || mongoose.model('Photo', photoSchema);