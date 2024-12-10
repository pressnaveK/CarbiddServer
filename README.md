## Run the Project
~~~
docker compose -f mySQL.yaml up -d
~~~

~~~
docker compose -f redis.yaml up -d
~~~
In developer mode with logs
```
yarn dev
```
~~~
yarn start
~~~


## Rate Limit in Server.js modify according to your wish
```
const limiter = rateLimit({
  
  windowMs: 2  * 1000, // 2 sec
  max: 1, // Limit each IP to 1 request per windowMs
  message: 'Too many requests, please try again later', // Custom message when limit is exceeded
  headers: true, // Set the rate-limit headers (X-RateLimit-Limit and X-RateLimit-Remaining)
});

app.use(limiter);
```
## Pooling Database for limiting connection with database in ./confin/mysql.js you can modify according to your wish
```
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'car_auction',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## Caching Frequent retrival table ./routes/auction.js
```
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

```
## Caching for finding highestbidvalue
```
 socket.on('place_bid', async ({ auctionID, user, amount }) => {
      console.log(auctionID, amount);
      try {
        const highestBid = parseFloat(await redis.get(`auction:${auctionID}:highbid`)) || 0;
        console.log('Current highest bid:', highestBid);

        if (amount > highestBid) {
          // Update Redis with the new highest bid and user
          await redis.set(`auction:${auctionID}:highbid`, amount);
          await redis.set(`auction:${auctionID}:lead`, user);

          // Publish the update using pubClient
          const updatedData = JSON.stringify({ auctionID, highestBid: amount, lead: user });
          pubClient.publish(`auction_updates:${auctionID}`, updatedData);

          console.log(`New bid placed: ${amount} by ${user} for auctionID: ${auctionID}`);
        } else {
          console.log('Bid amount is lower than the current highest bid.');
          socket.emit('bid_failed', { message: 'Your bid is lower than the current highest bid.' });
        }
      } catch (err) {
        socket.emit('error', err.message);
        console.error(err);
      }
    });

    // Subscribe to Redis channel for auction updates
    subClient.on('message', (channel, message) => {
      const { auctionID, highestBid, lead } = JSON.parse(message);
      console.log(`Update received on channel ${channel}:`, message);

      // Broadcast the update to the room (auctionID)
      io.to(auctionID).emit('updated', { highestBid, lead });
    });

    // Subscribe to specific auction updates
    socket.on('subscribe_updates', (auctionID) => {
      subClient.subscribe(`auction_updates:${auctionID}`);
      console.log(`Socket ${socket.id} subscribed to updates for auctionID: ${auctionID}`);
    });
```


