/**
 * Link Metadata Fetcher
 *
 * Fetches OpenGraph metadata, title tags, and favicons from URLs
 * for rich link previews and validation.
 *
 * Uses multiple validation strategies to handle bot-blocking sites:
 * 1. oEmbed APIs for supported platforms (YouTube, Vimeo, Spotify, etc.)
 * 2. Platform-specific APIs (GitHub)
 * 3. HEAD requests with browser User-Agent
 * 4. Full GET requests with browser User-Agent
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
  /** Confidence level: 'high' for API/oEmbed, 'medium' for successful fetch, 'low' for HEAD-only or lenient domain */
  validationConfidence?: 'high' | 'medium' | 'low';
}

/**
 * Generic oEmbed response structure
 */
interface OEmbedResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
  description?: string;
  provider_name?: string;
}

/**
 * oEmbed provider configuration
 */
interface OEmbedProvider {
  name: string;
  patterns: RegExp[];
  endpoint: string;
  favicon: string;
}

/**
 * Supported oEmbed providers (besides YouTube which has special handling)
 */
const OEMBED_PROVIDERS: OEmbedProvider[] = [
  {
    name: 'Vimeo',
    patterns: [/^https?:\/\/(www\.)?vimeo\.com\/\d+/i],
    endpoint: 'https://vimeo.com/api/oembed.json?url=',
    favicon: 'https://vimeo.com/favicon.ico',
  },
  {
    name: 'Spotify',
    patterns: [
      /^https?:\/\/open\.spotify\.com\/(track|album|playlist|episode|show)\//i,
    ],
    endpoint: 'https://open.spotify.com/oembed?url=',
    favicon: 'https://open.spotify.com/favicon.ico',
  },
  {
    name: 'SoundCloud',
    patterns: [/^https?:\/\/(www\.)?soundcloud\.com\/.+\/.+/i],
    endpoint: 'https://soundcloud.com/oembed?format=json&url=',
    favicon: 'https://soundcloud.com/favicon.ico',
  },
  {
    name: 'TikTok',
    patterns: [/^https?:\/\/(www\.)?tiktok\.com\/@.+\/video\/\d+/i],
    endpoint: 'https://www.tiktok.com/oembed?url=',
    favicon: 'https://www.tiktok.com/favicon.ico',
  },
  {
    name: 'CodePen',
    patterns: [/^https?:\/\/(www\.)?codepen\.io\/.+\/pen\/.+/i],
    endpoint: 'https://codepen.io/api/oembed?format=json&url=',
    favicon: 'https://codepen.io/favicon.ico',
  },
  {
    name: 'Loom',
    patterns: [/^https?:\/\/(www\.)?loom\.com\/share\/.+/i],
    endpoint: 'https://www.loom.com/v1/oembed?url=',
    favicon: 'https://www.loom.com/favicon.ico',
  },
  {
    name: 'Wistia',
    patterns: [/^https?:\/\/(.+\.)?wistia\.(com|net)\/(medias|embed)\/.+/i],
    endpoint: 'https://fast.wistia.com/oembed.json?url=',
    favicon: 'https://wistia.com/favicon.ico',
  },
  {
    name: 'SlideShare',
    patterns: [/^https?:\/\/(www\.)?slideshare\.net\/.+\/.+/i],
    endpoint: 'https://www.slideshare.net/api/oembed/2?format=json&url=',
    favicon: 'https://www.slideshare.net/favicon.ico',
  },
  {
    name: 'Dailymotion',
    patterns: [/^https?:\/\/(www\.)?dailymotion\.com\/video\/.+/i],
    endpoint: 'https://www.dailymotion.com/services/oembed?format=json&url=',
    favicon: 'https://www.dailymotion.com/favicon.ico',
  },
];

/**
 * Domains known to aggressively block bots but typically have valid content
 * For these domains, 403/401 responses are marked as 'unchecked' rather than 'broken'
 */
const LENIENT_DOMAINS = [
  'medium.com',
  'substack.com',
  'notion.so',
  'notion.site',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'instagram.com',
  'facebook.com',
  'tiktok.com',
  'pinterest.com',
  'quora.com',
  'reddit.com',
  'discord.com',
  'slack.com',
  'figma.com',
  'canva.com',
  'dribbble.com',
  'behance.net',
  'producthunt.com',
];

/**
 * Browser-like User-Agent to reduce bot blocking
 */
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * YouTube oEmbed response structure
 */
interface YouTubeOEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  html: string;
}

/**
 * Check if URL is a YouTube video URL and extract video ID
 */
function getYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    // youtube.com/watch?v=VIDEO_ID
    if (hostname === 'youtube.com' && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }

    // youtube.com/embed/VIDEO_ID
    if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/embed/')[1]?.split(/[?#]/)[0] || null;
    }

    // youtube.com/v/VIDEO_ID
    if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/v/')) {
      return urlObj.pathname.split('/v/')[1]?.split(/[?#]/)[0] || null;
    }

    // youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split(/[?#]/)[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch YouTube video metadata via oEmbed API
 * This is more reliable than scraping as YouTube blocks bot-like requests
 */
async function fetchYouTubeMetadata(
  url: string,
  timeout: number
): Promise<LinkMetadata> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    const response = await fetch(oembedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404 || response.status === 400) {
      return {
        url,
        status: 'broken',
        statusCode: response.status,
        error: 'Video not found or unavailable',
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        url,
        status: 'requires_login',
        statusCode: response.status,
        error: 'Video is private or restricted',
      };
    }

    if (!response.ok) {
      return {
        url,
        status: 'broken',
        statusCode: response.status,
        error: `YouTube API error: ${response.status}`,
      };
    }

    const data: YouTubeOEmbedResponse = await response.json();

    // Get higher quality thumbnail if available
    const thumbnailUrl = data.thumbnail_url?.replace('hqdefault', 'maxresdefault') || data.thumbnail_url;

    return {
      url,
      status: 'active',
      statusCode: 200,
      ogTitle: data.title,
      ogDescription: `Video by ${data.author_name}`,
      ogImage: thumbnailUrl,
      title: data.title,
      faviconUrl: 'https://www.youtube.com/favicon.ico',
      validationConfidence: 'high',
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        url,
        status: 'broken',
        error: 'Request timeout',
      };
    }

    return {
      url,
      status: 'broken',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Find matching oEmbed provider for a URL
 */
function findOEmbedProvider(url: string): OEmbedProvider | null {
  for (const provider of OEMBED_PROVIDERS) {
    if (provider.patterns.some((pattern) => pattern.test(url))) {
      return provider;
    }
  }
  return null;
}

/**
 * Fetch metadata via generic oEmbed API
 */
async function fetchOEmbedMetadata(
  url: string,
  provider: OEmbedProvider,
  timeout: number
): Promise<LinkMetadata> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const oembedUrl = `${provider.endpoint}${encodeURIComponent(url)}`;

    const response = await fetch(oembedUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404 || response.status === 400) {
      return {
        url,
        status: 'broken',
        statusCode: response.status,
        error: `${provider.name} content not found`,
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        url,
        status: 'requires_login',
        statusCode: response.status,
        error: `${provider.name} content is private or restricted`,
      };
    }

    if (!response.ok) {
      return {
        url,
        status: 'broken',
        statusCode: response.status,
        error: `${provider.name} API error: ${response.status}`,
      };
    }

    const data: OEmbedResponse = await response.json();

    return {
      url,
      status: 'active',
      statusCode: 200,
      ogTitle: data.title,
      ogDescription: data.description || (data.author_name ? `By ${data.author_name}` : undefined),
      ogImage: data.thumbnail_url,
      title: data.title,
      faviconUrl: provider.favicon,
      validationConfidence: 'high',
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        url,
        status: 'broken',
        error: 'Request timeout',
      };
    }

    // oEmbed failed, return null to fall through to regular fetch
    return {
      url,
      status: 'broken',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GitHub repository/content URL patterns
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; type: 'repo' | 'gist' | 'file' } | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    // GitHub Gist
    if (hostname === 'gist.github.com') {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1], type: 'gist' };
      }
    }

    // GitHub repo or file
    if (hostname === 'github.com') {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1], type: parts.length > 2 ? 'file' : 'repo' };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch GitHub metadata via API (no auth needed for public repos)
 */
async function fetchGitHubMetadata(
  url: string,
  timeout: number
): Promise<LinkMetadata | null> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let apiUrl: string;

    if (parsed.type === 'gist') {
      apiUrl = `https://api.github.com/gists/${parsed.repo}`;
    } else {
      apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ViaProto-LinkValidator/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      return {
        url,
        status: 'broken',
        statusCode: 404,
        error: 'GitHub repository not found',
      };
    }

    if (response.status === 403) {
      // Rate limited - fall back to regular fetch
      return null;
    }

    if (!response.ok) {
      return null; // Fall back to regular fetch
    }

    const data = await response.json();

    if (parsed.type === 'gist') {
      return {
        url,
        status: 'active',
        statusCode: 200,
        ogTitle: data.description || 'GitHub Gist',
        ogDescription: `Gist by ${data.owner?.login || 'unknown'}`,
        ogImage: data.owner?.avatar_url,
        title: data.description || 'GitHub Gist',
        faviconUrl: 'https://github.com/favicon.ico',
        validationConfidence: 'high',
      };
    }

    return {
      url,
      status: 'active',
      statusCode: 200,
      ogTitle: data.full_name,
      ogDescription: data.description || `GitHub repository by ${data.owner?.login}`,
      ogImage: data.owner?.avatar_url,
      title: data.full_name,
      faviconUrl: 'https://github.com/favicon.ico',
      validationConfidence: 'high',
    };
  } catch (error) {
    clearTimeout(timeoutId);
    // On any error, fall back to regular fetch
    return null;
  }
}

/**
 * Check if a domain should be treated leniently for 403/401 responses
 */
function isLenientDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return LENIENT_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Domains that should always have OpenGraph data if the link is working
 * Note: YouTube is handled separately via oEmbed API
 */
const EXPECTS_OG_DOMAINS = [
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
  /** Skip API-based validation and go straight to HTTP fetch */
  skipApiValidation?: boolean;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Extract OpenGraph meta tags from HTML
 */
function extractOpenGraphTags(html: string, baseUrl: string): Partial<LinkMetadata> {
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
    ogImage: rawImage ? resolveUrl(rawImage, baseUrl) : undefined,
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
 * Resolve a potentially relative URL to an absolute URL
 * Returns undefined for invalid URLs (data URIs, mailto, etc.)
 */
function resolveUrl(urlOrPath: string, baseUrl: string): string | undefined {
  // Reject data URIs, mailto, tel, javascript, and other non-http(s) schemes
  if (
    urlOrPath.startsWith('data:') ||
    urlOrPath.startsWith('mailto:') ||
    urlOrPath.startsWith('tel:') ||
    urlOrPath.startsWith('javascript:') ||
    urlOrPath.startsWith('blob:')
  ) {
    return undefined;
  }

  // Already absolute URL
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }

  // Protocol-relative URL (//example.com/image.png)
  if (urlOrPath.startsWith('//')) {
    return 'https:' + urlOrPath;
  }

  // Relative URL - resolve against base
  const url = new URL(baseUrl);

  // Absolute path (/img/logo.png)
  if (urlOrPath.startsWith('/')) {
    return url.origin + urlOrPath;
  }

  // Relative path (img/logo.png) - resolve against current path
  return url.origin + '/' + urlOrPath;
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
    const resolved = resolveUrl(favicon, baseUrl);
    // If resolveUrl returns undefined (data URI, etc.), fall through to default
    if (resolved) {
      return resolved;
    }
  }

  // Fallback to /favicon.ico
  const url = new URL(baseUrl);
  return `${url.origin}/favicon.ico`;
}

/**
 * Perform a HEAD request to check if URL is accessible
 */
async function checkUrlWithHead(
  url: string,
  timeout: number
): Promise<{ accessible: boolean; statusCode?: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    return {
      accessible: response.ok,
      statusCode: response.status,
    };
  } catch {
    clearTimeout(timeoutId);
    return { accessible: false };
  }
}

/**
 * Fetch metadata from a URL with timeout and error handling
 *
 * Uses tiered validation:
 * 1. oEmbed APIs for supported platforms (YouTube, Vimeo, Spotify, etc.)
 * 2. GitHub API for GitHub URLs
 * 3. HEAD request with browser User-Agent
 * 4. Full GET request with browser User-Agent
 */
export async function fetchLinkMetadata(
  url: string,
  options: FetchOptions = {}
): Promise<LinkMetadata> {
  const {
    timeout = DEFAULT_TIMEOUT,
    userAgent = BROWSER_USER_AGENT,
    skipApiValidation = false,
  } = options;

  // Validate URL format first
  try {
    new URL(url);
  } catch {
    return {
      url,
      status: 'broken',
      error: 'Invalid URL format',
    };
  }

  if (!skipApiValidation) {
    // 1. Handle YouTube URLs via oEmbed API
    const youtubeVideoId = getYouTubeVideoId(url);
    if (youtubeVideoId) {
      return fetchYouTubeMetadata(url, timeout);
    }

    // 2. Check for other oEmbed providers
    const oembedProvider = findOEmbedProvider(url);
    if (oembedProvider) {
      return fetchOEmbedMetadata(url, oembedProvider, timeout);
    }

    // 3. Check for GitHub URLs
    const githubResult = await fetchGitHubMetadata(url, timeout);
    if (githubResult) {
      return githubResult;
    }
  }

  // 4. Try HEAD request first (lighter weight)
  const headCheck = await checkUrlWithHead(url, timeout);

  // If HEAD succeeds, do a full GET to extract metadata
  // If HEAD fails with 403/401 on a lenient domain, still try GET
  const lenientDomain = isLenientDomain(url);
  const shouldTryGet =
    headCheck.accessible ||
    (lenientDomain && (headCheck.statusCode === 401 || headCheck.statusCode === 403));

  if (!shouldTryGet && headCheck.statusCode) {
    // HEAD definitively failed (404 or other error on non-lenient domain)
    if (headCheck.statusCode === 404) {
      return {
        url,
        status: 'broken',
        statusCode: headCheck.statusCode,
        error: 'Not Found',
      };
    }

    // For lenient domains, 401/403 means "unchecked" not "broken"
    if (lenientDomain && (headCheck.statusCode === 401 || headCheck.statusCode === 403)) {
      return {
        url,
        status: 'unchecked',
        statusCode: headCheck.statusCode,
        error: 'Site blocks automated requests - could not verify',
        validationConfidence: 'low',
      };
    }

    if (headCheck.statusCode === 401 || headCheck.statusCode === 403) {
      return {
        url,
        status: 'requires_login',
        statusCode: headCheck.statusCode,
        error: headCheck.statusCode === 401 ? 'Unauthorized' : 'Forbidden',
      };
    }

    if (headCheck.statusCode >= 400) {
      return {
        url,
        status: 'broken',
        statusCode: headCheck.statusCode,
        error: `HTTP ${headCheck.statusCode}`,
      };
    }
  }

  // 5. Full GET request for metadata extraction
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    const statusCode = response.status;

    // Handle different status codes
    if (statusCode === 401 || statusCode === 403) {
      // For lenient domains, 401/403 means we can't verify but it's probably fine
      if (lenientDomain) {
        return {
          url,
          status: 'unchecked',
          statusCode,
          error: 'Site blocks automated requests - could not verify',
          validationConfidence: 'low',
        };
      }
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
    const ogTags = extractOpenGraphTags(html, url);
    const title = extractTitle(html);
    const faviconUrl = extractFavicon(html, url);

    // Special handling for domains that should always have OpenGraph data
    // If we expect OG data but don't find any, treat as broken/suspicious
    const shouldHaveOg = expectsOpenGraph(url);
    const hasOgData = !!(ogTags.ogTitle || ogTags.ogImage || ogTags.ogDescription);

    if (shouldHaveOg && !hasOgData) {
      // For lenient domains, missing OG data might be due to bot blocking
      if (lenientDomain) {
        return {
          url,
          status: 'unchecked',
          statusCode,
          error: 'Could not extract metadata - site may block bots',
          title,
          faviconUrl,
          validationConfidence: 'low',
        };
      }
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
      title: title || ogTags.ogTitle,
      faviconUrl,
      validationConfidence: 'medium',
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        // Timeout on lenient domain - mark as unchecked
        if (lenientDomain) {
          return {
            url,
            status: 'unchecked',
            error: 'Request timeout - could not verify',
            validationConfidence: 'low',
          };
        }
        return {
          url,
          status: 'broken',
          error: 'Request timeout',
        };
      }

      // Network errors on lenient domains - mark as unchecked
      if (lenientDomain) {
        return {
          url,
          status: 'unchecked',
          error: `Could not verify: ${error.message}`,
          validationConfidence: 'low',
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
