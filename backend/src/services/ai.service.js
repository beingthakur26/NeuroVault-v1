import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export const generateSummaryAndTags = async (content) => {
  try {
    const response = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content analyzer. Summarize the text into 2-3 concise sentences and provide 3-5 relevant tags separated by commas. Format: SUMMARY: [summary] TAGS: [tag1, tag2...]',
        },
        {
          role: 'user',
          content: `Analyze this content:\n\n${content.substring(0, 2000)}`, // Limit content for cost/tokens
        },
      ],
    });

    const text = response.choices[0].message.content;
    const summaryMatch = text.match(/SUMMARY:\s*(.*?)(?=\s*TAGS:|$)/s);
    const tagsMatch = text.match(/TAGS:\s*(.*)/s);

    const summary = summaryMatch ? summaryMatch[1].trim() : 'No summary generated';
    const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : [];

    return { summary, tags };
  } catch (error) {
    console.error('Mistral AI Error (Summary/Tags):', error.message);
    return { summary: '', tags: [] };
  }
};

export const generateEmbedding = async (text) => {
  try {
    const response = await client.embeddings.create({
      model: 'mistral-embed',
      inputs: [text.substring(0, 1000)],
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Mistral AI Error (Embedding):', error.message);
    return [];
  }
};

export const generateTitleFromContent = async (content) => {
  try {
    const response = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        {
          role: 'system',
          content: 'You are a professional editor. Generate a short, catchy, and descriptive title (max 60 characters) for the following content. Return ONLY the title.',
        },
        {
          role: 'user',
          content: content.substring(0, 500),
        },
      ],
    });
    return response.choices[0].message.content.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error('Mistral AI Error (Title):', error.message);
    return 'Untitled Content';
  }
};
