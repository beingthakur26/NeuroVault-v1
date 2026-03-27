import { Mistral } from '@mistralai/mistralai'

// Initialize Mistral Client
const apiKey = process.env.MISTRAL_API_KEY
const client = apiKey ? new Mistral({ apiKey }) : null

export const getMistralClient = () => client

export const generateSummaryAndTags = async (content) => {
  if (!client) {
    console.warn("Mistral API key missing. Skipping AI summarization.")
    return { summary: "No summary available.", tags: ["demo"] }
  }

  try {
    const prompt = `
      Analyze the following content and provide a brief max 2-sentence summary and 3-5 relevant tags.
      Respond in strictly valid JSON format with keys "summary" and "tags".
      Content: ${content.substring(0, 4000)}
    `

    const response = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content)
    return {
      summary: result.summary,
      tags: result.tags
    }
  } catch (error) {
    console.error("Mistral Summary Error:", error)
    return { summary: "Failed to generate summary.", tags: [] }
  }
}

export const generateEmbeddings = async (text) => {
  // Using Jina embeddings as requested
  if (!process.env.JINA_API_KEY) {
    console.warn("Jina API key missing. Skipping embedding.")
    return new Array(768).fill(0) // Dummy vector
  }

  try {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v2-base-en',
        input: [text]
      })
    })

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error("Jina Embedding Error:", error)
    return new Array(768).fill(0)
  }
}
