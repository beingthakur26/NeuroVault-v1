import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConnection = new IORedis({
  host: process.env.REDIS_URL, // Using the host from REDIS_URL
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (error) => {
  console.error('Redis Connection Error:', error.message);
});

redisConnection.on('connect', () => {
  console.log('Redis Connected Successfully');
});

export default redisConnection;
