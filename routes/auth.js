const express = require('express');
const {pool} = require('../config/mysql');
const router = express.Router();

//EndPoint 

router.post('/login', (req, res) => {
  const { user_id, password } = req.body;
  const query = 'SELECT * FROM users WHERE user_id = ?';

  pool.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = results[0];
    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    res.status(200).json({ message: 'Login successful', userId: user.user_id, username: user.username });
  });
});

module.exports = router;