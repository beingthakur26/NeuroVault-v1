import * as cheerio from 'cheerio';
import crypto from 'crypto';

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
