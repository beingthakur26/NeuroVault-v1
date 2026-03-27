import Redis from 'ioredis'

export const redisConnection = process.env.UPSTASH_REDIS_REST_URL ? new Redis(process.env.UPSTASH_REDIS_REST_URL.replace('https://', 'rediss://'), { 
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
  maxRetriesPerRequest: null 
}) : null

if (!redisConnection) {
  console.warn("Upstash Redis URL not provided! BullMQ queues will fail.")
} else {
  console.log("Redis initialized for BullMQ.")
}
