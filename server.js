const express = require('express');
const rateLimit = require('express-rate-limit');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { createAdapter } = require ("@socket.io/redis-streams-adapter");
const {pubClient ,subClient} = require('./config/redis');
const auctionSocket = require('./sockets/auctionSocket');


// Configurations
const setupDatabase = require('./createDatabase'); 
setupDatabase();


// Routes
const authRoutes = require('./routes/auth');
const auctionsRoutes = require('./routes/auctions');
const bidsRouter = require('./routes/bids');
const usersRouter = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

// Create a rate limit rule
const limiter = rateLimit({
  
  windowMs: 2  * 1000, // 2 sec
  max: 1, // Limit each IP to 1 request per windowMs
  message: 'Too many requests, please try again later', // Custom message when limit is exceeded
  headers: true, // Set the rate-limit headers (X-RateLimit-Limit and X-RateLimit-Remaining)
});

app.use(limiter);

// Register REST API routes
app.use('/', authRoutes);
app.use('/', auctionsRoutes);
app.use('/', bidsRouter);
app.use('/', usersRouter);

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
  adapter: createAdapter(pubClient, subClient)
});

auctionSocket(io);

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
