import * as cheerio from 'cheerio'
import axios from 'axios'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

/**
 * Detects the URL type and routes it to the correct extractor.
 */
export const extractContentFromUrl = async (url) => {
  try {
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be')
    const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?')

    let content = ''
    let title = ''

    if (isYoutube) {
      const result = await extractYouTube(url)
      content = result.content
      title = result.title || url
    } else if (isPdf) {
      const result = await extractPdf(url)
      content = result.content
      title = result.title || url
    } else {
      const result = await extractArticle(url)
      content = result.content
      title = result.title || url
    }

    // Truncate content to fit common LLM context limits roughly
    return {
      title,
      content: content.substring(0, 8000), 
      type: isYoutube ? 'video' : (isPdf ? 'pdf' : 'article'),
    }
  } catch (error) {
    console.error(`Extractor error for ${url}:`, error.message)
    // Fall back to just returning the raw URL if extraction completely fails
    return { title: url, content: `Failed to extract. URL: ${url}`, type: 'article' }
  }
}

/**
 * Extracts YouTube metadata using the official API
 */
async function extractYouTube(url) {
  try {
    // Extract Video ID
    const match = url.match(/[?&]v=([^&]+)|youtu\.be\/([^?]+)/)
    const videoId = match ? (match[1] || match[2]) : null
    
    if (!videoId) return { content: `YouTube Video: ${url}`, title: 'YouTube Video' }

    // Use API given in the environment or fallback
    if (!process.env.YOUTUBE_API_KEY) {
      return { content: `YouTube Video ID: ${videoId}. (No transcript extracted: Missing YOUTUBE_API_KEY)`, title: 'YouTube Video' }
    }

    const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
      params: {
        part: 'snippet',
        id: videoId,
        key: process.env.YOUTUBE_API_KEY
      }
    })

    if (data.items && data.items.length > 0) {
      const snippet = data.items[0].snippet
      const title = snippet.title
      const content = `${snippet.title}\n\n${snippet.description}\n\nTags: ${snippet.tags?.join(', ') || ''}`
      return { content, title }
    }

    return { content: `YouTube Video: ${url}`, title: 'YouTube Video' }
  } catch (err) {
    console.warn("YouTube API failed:", err.message)
    return { content: `YouTube Video: ${url}`, title: 'YouTube Video' }
  }
}

/**
 * Downloads and parses PDF
 */
async function extractPdf(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const data = await pdfParse(response.data)
    return { content: data.text, title: data.info?.Title || 'PDF Document' }
  } catch (err) {
    console.warn("PDF extraction failed:", err.message)
    return { content: `PDF Document: ${url}`, title: 'PDF Document' }
  }
}

/**
 * Scrapes article body text
 */
async function extractArticle(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    })
    const $ = cheerio.load(response.data)
    
    // Remove scripts and styles
    $('script, style, nav, footer, header, aside').remove()
    
    const title = $('title').text()
    const content = $('body').text().replace(/\s+/g, ' ').trim()
    
    return { content, title }
  } catch (err) {
    console.warn("Article scraping failed:", err.message)
    return { content: `Article: ${url}`, title: 'Web Article' }
  }
}
