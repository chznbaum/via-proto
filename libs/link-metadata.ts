/**
 * Link Metadata Fetcher
 *
 * Fetches OpenGraph metadata, title tags, and favicons from URLs
 * for rich link previews and validation.
 */

export interface LinkMetadata {
  url: string;
  status: 'active' | 'broken' | 'requires_login' | 'unchecked';
  statusCode?: number;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  title?: string;
  faviconUrl?: string;
  error?: string;
}

/**
 * Domains that should always have OpenGraph data if the link is working
 */
const EXPECTS_OG_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'linkedin.com',
  'instagram.com',
  'github.com',
  'medium.com',
  'dev.to',
  'stackoverflow.com',
];

/**
 * Check if a domain should always have OpenGraph metadata
 */
function expectsOpenGraph(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return EXPECTS_OG_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#39;': "'",
    '&apos;': "'",
  };

  let decoded = text;

  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Replace numeric entities (e.g., &#39;)
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));

  // Replace hex entities (e.g., &#x27;)
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return decoded;
}

interface FetchOptions {
  timeout?: number; // milliseconds
  userAgent?: string;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_USER_AGENT = 'ViaProto/1.0 (Link Validator)';

/**
 * Extract OpenGraph meta tags from HTML
 */
function extractOpenGraphTags(html: string): Partial<LinkMetadata> {
  const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
  const ogDescription = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1];
  const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];

  // Also try reversed attribute order
  const ogTitleAlt = html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i)?.[1];
  const ogDescriptionAlt = html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i)?.[1];
  const ogImageAlt = html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1];

  const rawTitle = ogTitle || ogTitleAlt;
  const rawDescription = ogDescription || ogDescriptionAlt;
  const rawImage = ogImage || ogImageAlt;

  return {
    ogTitle: rawTitle ? decodeHtmlEntities(rawTitle) : undefined,
    ogDescription: rawDescription ? decodeHtmlEntities(rawDescription) : undefined,
    ogImage: rawImage,
  };
}

/**
 * Extract <title> tag from HTML
 */
function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = match?.[1]?.trim();
  return rawTitle ? decodeHtmlEntities(rawTitle) : undefined;
}

/**
 * Extract favicon URL from HTML
 * Supports various favicon formats and locations
 */
function extractFavicon(html: string, baseUrl: string): string | undefined {
  // Try standard favicon link tags
  const iconLink = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i)?.[1];
  const iconLinkAlt = html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i)?.[1];

  const favicon = iconLink || iconLinkAlt;

  if (favicon) {
    // Make absolute URL if relative
    if (favicon.startsWith('http://') || favicon.startsWith('https://')) {
      return favicon;
    } else if (favicon.startsWith('//')) {
      return 'https:' + favicon;
    } else {
      const url = new URL(baseUrl);
      return url.origin + (favicon.startsWith('/') ? favicon : '/' + favicon);
    }
  }

  // Fallback to /favicon.ico
  const url = new URL(baseUrl);
  return `${url.origin}/favicon.ico`;
}

/**
 * Fetch metadata from a URL with timeout and error handling
 */
export async function fetchLinkMetadata(
  url: string,
  options: FetchOptions = {}
): Promise<LinkMetadata> {
  const { timeout = DEFAULT_TIMEOUT, userAgent = DEFAULT_USER_AGENT } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Validate URL format
    new URL(url); // Throws if invalid

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow', // Follow redirects
    });

    clearTimeout(timeoutId);

    const statusCode = response.status;

    // Handle different status codes
    if (statusCode === 401 || statusCode === 403) {
      return {
        url,
        status: 'requires_login',
        statusCode,
        error: statusCode === 401 ? 'Unauthorized' : 'Forbidden',
      };
    }

    if (statusCode === 404) {
      return {
        url,
        status: 'broken',
        statusCode,
        error: 'Not Found',
      };
    }

    if (statusCode >= 400 && statusCode < 600) {
      return {
        url,
        status: 'broken',
        statusCode,
        error: `HTTP ${statusCode}`,
      };
    }

    // Success - extract metadata
    const html = await response.text();
    const ogTags = extractOpenGraphTags(html);
    const title = extractTitle(html);
    const faviconUrl = extractFavicon(html, url);

    // Special handling for domains that should always have OpenGraph data
    // If we expect OG data but don't find any, treat as broken/suspicious
    const shouldHaveOg = expectsOpenGraph(url);
    const hasOgData = !!(ogTags.ogTitle || ogTags.ogImage || ogTags.ogDescription);

    if (shouldHaveOg && !hasOgData) {
      return {
        url,
        status: 'broken',
        statusCode,
        error: 'Expected OpenGraph metadata not found (link may be broken)',
        title,
        faviconUrl,
      };
    }

    return {
      url,
      status: 'active',
      statusCode,
      ...ogTags,
      title: title || ogTags.ogTitle, // Fallback to OG title if no <title>
      faviconUrl,
    };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          url,
          status: 'broken',
          error: 'Request timeout',
        };
      }

      return {
        url,
        status: 'broken',
        error: error.message,
      };
    }

    return {
      url,
      status: 'broken',
      error: 'Unknown error',
    };
  }
}

/**
 * Batch fetch metadata for multiple URLs
 * Processes URLs concurrently with a limit to avoid overwhelming servers
 */
export async function fetchMultipleLinkMetadata(
  urls: string[],
  options: FetchOptions & { concurrency?: number } = {}
): Promise<LinkMetadata[]> {
  const { concurrency = 5, ...fetchOptions } = options;
  const results: LinkMetadata[] = [];

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => fetchLinkMetadata(url, fetchOptions))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Extract domain from URL for display
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
