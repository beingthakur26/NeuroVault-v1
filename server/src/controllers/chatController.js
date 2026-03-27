import { getMistralClient, generateEmbeddings } from '../services/aiService.js'
import { searchSimilar } from '../services/qdrantService.js'
import Item from '../models/Item.js'
import User from '../models/User.js'

export const handleChatStream = async (req, res) => {
  const { messages } = req.body;
  const clerkId = req.auth.userId;
  
  if (!messages || !messages.length) {
    return res.status(400).json({ error: "Missing messages array" });
  }
  
  const user = await User.findOne({ clerkId });
  const client = getMistralClient();
  
  if (!client) {
    return res.status(500).json({ error: "AI Service not properly initialized" });
  }
  
  // Set up Server-Sent Events (SSE) headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 1. Get the latest user query from the messages stack
  const lastUserMessage = messages[messages.length - 1].content;
  
  try {
    // 2. Vectorize the user's latest query
    const vector = await generateEmbeddings(lastUserMessage);
    
    // 3. Search Qdrant for the top 5 semantically similar items
    const similar = await searchSimilar(vector, 5, {
      must: [{ key: "userId", match: { value: user?._id?.toString() } }]
    });
    
    // Map IDs to original MongoDB documents
    const ids = similar.map(s => s.id);
    const semanticItems = await Item.find({ vectorId: { $in: ids }, userId: user._id });
    
    // 4. Construct the contextual prompt using the extracted texts
    let contextText = semanticItems.map(item => `Title: ${item.title}\nTags: ${item.tags.join(', ')}\nContent: ${item.content || item.summary}`).join('\n---\n');
    
    const systemPrompt = `You are NeuroVault AI, a highly intelligent and helpful "Second Brain" assistant.
You help the user recall facts and synthesize information from their saved bookmarks, articles, notes, and videos.
Strictly answer the user's questions utilizing the contextual data provided below.
If the context does exist below, synthesize the information wonderfully. If the answer is absolutely not in the context, politely state that you cannot find it in their saved items. You may casually answer general conversation but ground factual claims to the context.

=== SAVED ITEMS CONTEXT ===
${contextText.length > 0 ? contextText : "No relevant items found in the user's brain for this specific query."}
=========================`;

    // 5. Structure payload for Mistral AI SDK
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    // 6. Stream completion directly via Server-Sent Events
    const stream = await client.chat.stream({
      model: 'mistral-small-latest',
      messages: apiMessages
    });

    for await (const chunk of stream) {
      const deltaContent = chunk.data?.choices?.[0]?.delta?.content;
      if (deltaContent) {
         res.write(`data: ${JSON.stringify({ content: deltaContent })}\n\n`);
      }
    }
    
    // Signal termination flag
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error("Chat Stream Generator Error:", error);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate AI response." })}\n\n`);
    res.end();
  }
}
