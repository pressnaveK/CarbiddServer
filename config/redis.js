Redis = require("ioredis");

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 0,
});

const pubClient = redis.duplicate();
const subClient = redis.duplicate();

redis.on('connect', () => {
  console.log('Connected to Redis');
});

module.exports = {redis , pubClient ,subClient};