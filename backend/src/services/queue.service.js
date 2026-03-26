import { Queue } from 'bullmq';
import redisConnection from '../config/redis.js';

export const ITEM_QUEUE_NAME = 'item-processing';

const itemQueue = new Queue(ITEM_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
});

export const addItemToQueue = async (data) => {
  await itemQueue.add('process-item', data);
};

export default itemQueue;
