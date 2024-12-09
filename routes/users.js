const express = require('express');
const router = express.Router();
const db = require('../config/mysql');

// POST endpoint to create a new user
router.post('/users', (req, res) => {
  const { user_id, username, password } = req.body;

  // Validate the request body
  if (!user_id || !username || !password) {
    return res.status(400).json({ message: 'user_id, username, and password are required' });
  }

  const query = `
    INSERT INTO users (user_id, username, password)
    VALUES (?, ?, ?)
  `;

  db.query(query, [user_id, username, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  });
});

module.exports = router;