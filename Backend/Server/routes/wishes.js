const express = require('express');
const router = express.Router();
const Wish = require('../models/Wish');

// GET /api/wishes - Get all wishes/comments with pagination
router.get('/', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to load wishes' });
  }
});

// POST /api/wishes - Add a new wish/comment
router.post('/', async (req, res) => {
  try {
    const { name, message, guestId } = req.body;
    
    // Basic validation
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }
    
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message is too long (max 500 characters)' });
    }
    
    // Create and save new wish
    const wish = new Wish({
      name,
      message,
      guestId
    });
    
    await wish.save();
    res.status(201).json(wish);
  } catch (err) {
    console.error('Error adding wish:', err);
    res.status(500).json({ error: 'Failed to add wish' });
  }
});

// DELETE /api/wishes/:id - Delete a wish (admin only)
router.delete('/:id', async (req, res) => {
  try {
    // Add authentication check here for admin
    const wish = await Wish.findByIdAndDelete(req.params.id);
    
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    
    res.json({ message: 'Wish deleted successfully' });
  } catch (err) {
    console.error('Error deleting wish:', err);
    res.status(500).json({ error: 'Failed to delete wish' });
  }
});

module.exports = router;
