import { QdrantClient } from '@qdrant/js-client-rest'

const qdrant = process.env.QDRANT_URL ? new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
}) : null

const COLLECTION_NAME = "neurovault_items"

export const initQdrant = async () => {
  if (!qdrant) return console.warn("Qdrant missing")
  try {
    const collections = await qdrant.getCollections()
    const exists = collections.collections.find(c => c.name === COLLECTION_NAME)
    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768, // Jina v2 base size
          distance: 'Cosine'
        }
      })
      console.log("Qdrant Collection created")
    }
  } catch (error) {
    console.error("Qdrant Init Error:", error)
  }
}

export const upsertVector = async (id, vector, payload = {}) => {
  if (!qdrant) return false
  return await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: [{
      id: id,
      vector: vector,
      payload: payload
    }]
  })
}

export const searchSimilar = async (vector, limit = 10, filter = null) => {
  if (!qdrant) return []
  return await qdrant.search(COLLECTION_NAME, {
    vector: vector,
    limit,
    filter,
    with_payload: true
  })
}

export const deleteVector = async (id) => {
  if (!qdrant) return false
  return await qdrant.delete(COLLECTION_NAME, {
    points: [id]
  })
}
