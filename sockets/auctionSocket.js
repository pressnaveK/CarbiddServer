const redis = require('../config/redis');

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
    socket.on('check',()=>{
      socket.to(3).emit("this");
    })

    socket.on('place_bid', async ({ auctionID, user, amount }) => {
      console.log(auctionID,amount);
      try {
        console.log("placed");
        const highestBid = parseFloat(await redis.get(`auction:${auctionID}:highbid`)) || 0;
        console.log(highestBid,amount);
        if (amount > highestBid) {
          await redis.set(`auction:${auctionID}:highbid`, amount);
          await redis.set(`auction:${auctionID}:lead`, user);
        }
      } catch (err) {
        socket.emit('error', err);
        console.error(err);
      }
    });
    socket.on('update',async(auctionID)=>{
      const highestBid = parseFloat(await redis.get(`auction:${auctionID}:highbid`)) || 0;
      const lead = await redis.get(`auction:${auctionID}:highbid`);
      const data = {
        highestBid: highestBid,
        lead:lead
      }
      socket.to(auctionID).emit("updated",data);
      
    });


    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = auctionSocket;