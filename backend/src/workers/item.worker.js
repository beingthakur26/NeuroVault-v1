import { scrapeAndClean } from '../utils/scraper.js';
import { generateSummaryAndTags, generateEmbedding, generateTitleFromContent } from '../services/ai.service.js';

const startWorker = () => {
  const worker = new Worker(ITEM_QUEUE_NAME, async (job) => {
    const { itemId, url } = job.data;
    console.log(`Processing item: ${itemId} | URL: ${url}`);

    try {
      const item = await Item.findById(itemId);
      if (!item) {
        console.warn(`\u26A0\uFE0F Skipping job: Item ${itemId} not found in database. It may have been deleted.`);
        return; // Discard job
      }

      // 1. Scraping and Cleaning
      const { data: html } = await axios.get(url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecondBrainBot/1.0' }
      });
      
      const scraped = scrapeAndClean(html);
      
      // Validation: Is content too short/useless?
      if (scraped.content.length < 100) {
        item.status = 'failed';
        item.content = 'Content too short or restricted for indexing.';
        await item.save();
        console.error(`Job Failed ${job.id}: Content body too short.`);
        return;
      }

      // Content-based Deduplication Check
      const duplicateContent = await Item.findOne({ 
        userId: item.userId, 
        contentHash: scraped.hash, 
        _id: { $ne: itemId } 
      });

      if (duplicateContent) {
        item.status = 'failed';
        item.content = `Duplicate content detected (matches: ${duplicateContent.title})`;
        await item.save();
        console.warn(`Duplicate content found for item ${itemId}. Skipping.`);
        return;
      }

      // Fallback: Generate Title via AI if missing
      let finalTitle = scraped.title || scraped.description;
      if (!finalTitle || finalTitle === 'No Title') {
        finalTitle = await generateTitleFromContent(scraped.content);
      }

      // 2. AI Processing
      const { summary, tags } = await generateSummaryAndTags(scraped.content);
      const embedding = await generateEmbedding(scraped.content);

      // 3. Vector Indexing (Qdrant)
      if (embedding && embedding.length > 0) {
        await upsertVector(itemId, embedding, { title: finalTitle, url, userId: item.userId });
      }

      // 4. Save Results to MongoDB
      item.title = finalTitle;
      item.content = scraped.content.substring(0, 1000);
      item.summary = summary;
      item.tags = tags;
      item.embedding = embedding;
      item.contentHash = scraped.hash;
      item.status = 'completed';
      
      await item.save();
      console.log(`Successfully processed and indexed item: ${itemId}`);
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error.message);
      
      const item = await Item.findById(itemId);
      if (item) {
        item.status = 'failed';
        await item.save();
      }
      
      throw error;
    }
  }, {
    connection: redisConnection,
  });

  console.log('Item Worker (with AI & Vector) started');
  return worker;
};

export default startWorker;
