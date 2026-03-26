import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export const COLLECTION_NAME = 'items';

export const initQdrant = async () => {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      console.log(`Creating Qdrant collection: ${COLLECTION_NAME}`);
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1024, // Mistral embed model size
          distance: 'Cosine',
        },
      });
    }
    console.log('Qdrant initialized');
  } catch (error) {
    console.error('Qdrant Initialization Error:', error.message);
  }
};

export default qdrantClient;
