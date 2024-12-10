const express = require('express');
const router = express.Router();
const {pool} = require('../config/mysql');

// POST endpoint to place a new bid
router.post('/bids', (req, res) => {
  const { user_id, auction_id, bid_amount } = req.body;

  // Validate the request body
  if (!user_id || !auction_id || !bid_amount) {
    return res.status(400).json({ message: 'user_id, auction_id, and bid_amount are required' });
  }

  const query = `
    INSERT INTO bids (user_id, auction_id, bid_amount) VALUES (?, ?, ?)
  `;

  pool.query(query, [user_id, auction_id, bid_amount], (err, result) => {
    if (err) {
      console.error('Error placing bid:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ message: 'Bid placed successfully', bidId: result.insertId });
  });
});

module.exports = router;