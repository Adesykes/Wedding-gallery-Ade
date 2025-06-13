const mongoose = require('mongoose');

const wishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  guestId: {
    type: String,
    required: false
  }
});

// Prevent OverwriteModelError in dev/hot-reload
module.exports = mongoose.models.Wish || mongoose.model('Wish', wishSchema);
