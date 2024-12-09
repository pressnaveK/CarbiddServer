const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const auctionSocket = require('./sockets/auctionSocket');

// Configurations
const db = require('./config/mysql');
const redis = require('./config/redis');
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
});

auctionSocket(io);

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
