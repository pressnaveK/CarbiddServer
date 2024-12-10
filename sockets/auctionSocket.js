const { redis, pubClient, subClient } = require('../config/redis');

const auctionSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_auction', (auctionID) => {
      socket.join(auctionID);
      console.log(`User ${socket.id} joined auctionID: ${auctionID}`);
    });

    socket.on('leave_auction', (auctionID) => {
      socket.leave(auctionID);
      console.log(`User ${socket.id} left auctionID: ${auctionID}`);
    });

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

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = auctionSocket;