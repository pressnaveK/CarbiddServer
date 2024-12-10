const express = require('express');
const {pool} = require('../config/mysql');
const {redis} = require('../config/redis'); // Assuming this is the Redis connection
const router = express.Router();

const CACHE_KEY = 'auctions_cache';

// POST route to create an auction
router.post('/auctions', async (req, res) => {
  const { auction_id, car_id, start_datetime, end_datetime } = req.body;

  if (!auction_id || !car_id || !start_datetime || !end_datetime) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = 'INSERT INTO auctions (auction_id, car_id, start_datetime, end_datetime) VALUES (?, ?, ?, ?)';

  pool.query(query, [auction_id, car_id, start_datetime, end_datetime], async (err) => {
    if (err) {
      console.error('Error inserting auction:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Clear cache on new auction creation
    try {
      await redis.del(CACHE_KEY);
    } catch (cacheErr) {
      console.error('Error clearing cache:', cacheErr);
    }

    res.status(201).json({ message: 'Auction created successfully', auctionId: auction_id });
  });
});

// GET route to fetch auctions with caching
router.get('/auctions', async (req, res) => {
  try {
    // Check cache first
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      console.log('Returning data from cache');
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Fetch data from the database if not cached
    const query = 'SELECT * FROM auctions WHERE end_datetime > NOW()';
    pool.query(query, async (err, results) => {
      if (err) {
        console.error('Error fetching auctions:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Store the results in the cache with a TTL of 60 seconds
      try {
        await redis.set(CACHE_KEY, JSON.stringify(results), 'EX', 60);
      } catch (cacheErr) {
        console.error('Error caching data:', cacheErr);
      }

      console.log('Returning data from database');
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
