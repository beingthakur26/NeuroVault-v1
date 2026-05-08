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

export const searchVectors = async (vector, limit = 10, userId, filters = {}) => {
  try {
    const must = [
      {
        key: 'userId',
        match: { value: userId },
      },
    ];

    if (filters.type) {
      must.push({ key: 'type', match: { value: filters.type } });
    }

    if (filters.tag) {
      must.push({ key: 'tags', match: { value: filters.tag } });
    }

    const results = await qdrantClient.search(COLLECTION_NAME, {
      vector: vector,
      limit: limit,
      with_payload: true,
      filter: { must },
    });
    return results;
  } catch (error) {
    console.error('Vector Search Error:', error.message);
    return [];
  }
};
