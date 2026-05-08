import * as cheerio from 'cheerio';
import crypto from 'crypto';
import axios from 'axios';
// import { YoutubeTranscript } from 'youtube-transcript';
import YouTubeTranscript from "youtube-transcript";

/**
 * Scrapes and cleans content from a web page.
 * Removes noise like scripts, styles, and ads.
 */
export const scrapeAndClean = (html) => {
  const $ = cheerio.load(html);

  // 1. Remove noise
  $('script, style, iframe, noscript, footer, nav, header, aside, .ads, .advertisement, #comments').remove();

  // 2. Extract metadata
  const title = 
    $('meta[property="og:title"]').attr('content') || 
    $('meta[name="twitter:title"]').attr('content') || 
    $('title').text() || 
    $('h1').first().text();

  const description = 
    $('meta[property="og:description"]').attr('content') || 
    $('meta[name="description"]').attr('content');

  // 3. Extract meaningful text
  // We prioritize the main content areas if they exist, otherwise fallback to all paragraphs
  let content = '';
  const mainSelectors = ['article', 'main', '.content', '.post-content', '.article-body'];
  
  let mainFound = false;
  for (const selector of mainSelectors) {
    const el = $(selector);
    if (el.length > 0) {
      content = el.text();
      mainFound = true;
      break;
    }
  }

  if (!mainFound) {
    content = $('p').map((i, el) => $(el).text()).get().join(' ');
  }

  // 4. Cleanup text
  const cleanedContent = content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();

  // 5. Generate content hash for deduplication
  const hash = crypto.createHash('md5').update(cleanedContent).digest('hex');

  return {
    title: title?.trim(),
    description: description?.trim(),
    content: cleanedContent,
    hash
  };
};

export const extractContentFromUrl = async (url) => {
  let title = '';
  let description = '';
  let content = '';

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    try {
      // const transcript = await YouTubeTranscript.fetchTranscript(url);
      const transcript = await YouTubeTranscript.fetchTranscript("VIDEO_ID");
      content = transcript.map(t => t.text).join(' ');
      title = 'YouTube Video'; // Fallback, AI can improve this
    } catch (e) {
      console.warn('Could not fetch YT transcript, falling back to metadata:', e.message);
      // Fallback to normal scraping if transcript is disabled
      const { data: html } = await axios.get(url, { timeout: 10000 });
      const scraped = scrapeAndClean(html);
      title = scraped.title;
      description = scraped.description;
      content = scraped.content;
    }
  } else {
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecondBrainBot/1.0' }
    });
    const scraped = scrapeAndClean(html);
    title = scraped.title;
    description = scraped.description;
    content = scraped.content;
  }

  const cleanedContent = content.replace(/\s+/g, ' ').trim();
  const hash = crypto.createHash('md5').update(cleanedContent).digest('hex');

  return { title, description, content: cleanedContent, hash };
};

export const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Only allow http/https and prevent local IPs for security
    const isLocal = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(parsed.hostname) || parsed.hostname === 'localhost';
    return ['http:', 'https:'].includes(parsed.protocol) && !isLocal;
  } catch {
    return false;
  }
};
