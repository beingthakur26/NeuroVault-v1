import qdrantClient, { COLLECTION_NAME } from '../config/qdrant.js';

export const upsertVector = async (itemId, vector, metadata) => {
  try {
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: itemId, // Qdrant IDs can be UUIDs or integers. MongoDB IDs need to be handled carefully.
          vector: vector,
          payload: metadata,
        },
      ],
    });
    console.log(`Vector upserted for item: ${itemId}`);
  } catch (error) {
    console.error('Vector Upsert Error:', error.message);
  }
};

export const searchVectors = async (vector, limit = 10) => {
  try {
    const results = await qdrantClient.search(COLLECTION_NAME, {
      vector: vector,
      limit: limit,
      with_payload: true,
    });
    return results;
  } catch (error) {
    console.error('Vector Search Error:', error.message);
    return [];
  }
};
