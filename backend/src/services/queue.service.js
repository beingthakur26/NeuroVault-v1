import { Queue } from 'bullmq';
import redisConnection from '../config/redis.js';

export const ITEM_QUEUE_NAME = 'item-processing';

const itemQueue = new Queue(ITEM_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const addItemToQueue = async (data) => {
  await itemQueue.add('processItem', data);
};

export default itemQueue;
