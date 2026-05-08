import { extractContentFromUrl } from '../utils/scraper.js';
import { generateSummaryAndTags, generateEmbedding, generateTitleFromContent } from '../services/ai.service.js';
import { Worker } from "bullmq";
import { ITEM_QUEUE_NAME } from "../services/queue.service.js";
import  redisConnection  from "../config/redis.js";
import Item from "../models/Item.js";
import axios from "axios";
import { upsertVector } from "../services/vector.service.js";

const startWorker = () => {
  const worker = new Worker(ITEM_QUEUE_NAME, async (job) => {
    const { itemId, url } = job.data;
    
    // Status Tracker: If this is a retry, update MongoDB status to 'retrying'
    if (job.attemptsMade > 0) {
      console.log(`\u2139\uFE0F Retry attempt ${job.attemptsMade} for item: ${itemId}`);
      await Item.findByIdAndUpdate(itemId, { status: 'retrying' });
    } else {
      console.log(`\uD83D\uDCE6 Processing item: ${itemId} | URL: ${url}`);
    }

    try {
      const item = await Item.findById(itemId);
// ... (rest of the try block remains mostly same, ensuring high quality extraction) ...
      if (!item) {
        console.warn(`\u26A0\uFE0F Skipping job: Item ${itemId} not found in database.`);
        return;
      }

      const scraped = await extractContentFromUrl(url);
      
      if (scraped.content.length < 100) {
        item.status = 'failed';
        item.content = 'Content too short or restricted for indexing.';
        await item.save();
        return;
      }

      const duplicateContent = await Item.findOne({ 
        userId: item.userId, 
        contentHash: scraped.hash, 
        _id: { $ne: itemId } 
      });

      if (duplicateContent) {
        item.status = 'failed';
        item.content = `Duplicate content detected (matches: ${duplicateContent.title})`;
        await item.save();
        return;
      }

      let finalTitle = scraped.title || scraped.description;
      if (!finalTitle || finalTitle === 'No Title') {
        finalTitle = await generateTitleFromContent(scraped.content);
      }

      const { summary, tags } = await generateSummaryAndTags(scraped.content);
      const embedding = await generateEmbedding(scraped.content);

      if (embedding && embedding.length > 0) {
        await upsertVector(itemId, embedding, { title: finalTitle, url, userId: item.userId });
      }

      item.title = finalTitle;
      item.content = scraped.content.substring(0, 1000);
      item.summary = summary;
      item.tags = tags;
      item.embedding = embedding;
      item.contentHash = scraped.hash;
      item.status = 'completed';
      
      await item.save();
    } catch (error) {
      console.error(`\u274C Error processing job ${job.id}:`, error.message);
      
      // If we have exhausted all retries, mark as failed
      if (job.attemptsMade >= 4) { // 5 total attempts (0 to 4)
        console.error(`\uD83D\uDED1 Max retries reached for item: ${itemId}. Marking as failed.`);
        await Item.findByIdAndUpdate(itemId, { status: 'failed' });
      } else {
        // Otherwise, mark as retrying so the UI reflects the status
        await Item.findByIdAndUpdate(itemId, { status: 'retrying' });
      }
      
      throw error;
    }
  }, {
    connection: redisConnection,
  });

  // Monitoring Listeners
  worker.on('completed', (job) => {
    console.log(`\u2705 Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`\u26A0\uFE0F Job ${job?.id} failed with error: ${err.message}`);
  });

  console.log('Item Worker (Reliability Mode) started');
  return worker;
};

export default startWorker;
