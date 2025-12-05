/**
 * Search Engine Configuration
 *
 * URL templates for supported search engines.
 * Use {query} as placeholder for the search query.
 */

export type SearchEngineId =
  | 'duckduckgo'
  | 'google'
  | 'bing'
  | 'kagi'
  | 'yandex'
  | 'startpage'
  | 'brave'
  | 'ecosia'
  | 'yahoo'
  | 'baidu'
  | 'qwant'
  | 'mojeek'
  | 'you';

export interface SearchEngine {
  id: SearchEngineId;
  name: string;
  urlTemplate: string;
  icon?: string;
}

export const SEARCH_ENGINES: Record<SearchEngineId, SearchEngine> = {
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    urlTemplate: 'https://duckduckgo.com/?q={query}',
  },
  google: {
    id: 'google',
    name: 'Google',
    urlTemplate: 'https://www.google.com/search?q={query}',
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    urlTemplate: 'https://www.bing.com/search?q={query}',
  },
  kagi: {
    id: 'kagi',
    name: 'Kagi',
    urlTemplate: 'https://kagi.com/search?q={query}',
  },
  yandex: {
    id: 'yandex',
    name: 'Yandex',
    urlTemplate: 'https://yandex.com/search/?text={query}',
  },
  startpage: {
    id: 'startpage',
    name: 'Startpage',
    urlTemplate: 'https://www.startpage.com/sp/search?query={query}',
  },
  brave: {
    id: 'brave',
    name: 'Brave Search',
    urlTemplate: 'https://search.brave.com/search?q={query}',
  },
  ecosia: {
    id: 'ecosia',
    name: 'Ecosia',
    urlTemplate: 'https://www.ecosia.org/search?q={query}',
  },
  yahoo: {
    id: 'yahoo',
    name: 'Yahoo',
    urlTemplate: 'https://search.yahoo.com/search?p={query}',
  },
  baidu: {
    id: 'baidu',
    name: 'Baidu',
    urlTemplate: 'https://www.baidu.com/s?wd={query}',
  },
  qwant: {
    id: 'qwant',
    name: 'Qwant',
    urlTemplate: 'https://www.qwant.com/?q={query}',
  },
  mojeek: {
    id: 'mojeek',
    name: 'Mojeek',
    urlTemplate: 'https://www.mojeek.com/search?q={query}',
  },
  you: {
    id: 'you',
    name: 'You.com',
    urlTemplate: 'https://you.com/search?q={query}',
  },
};

export const DEFAULT_SEARCH_ENGINE: SearchEngineId = 'duckduckgo';

/**
 * Get search engine options for UI dropdowns
 */
export function getSearchEngineOptions(): { value: SearchEngineId; label: string }[] {
  return Object.values(SEARCH_ENGINES).map((engine) => ({
    value: engine.id,
    label: engine.name,
  }));
}

/**
 * Generate a search URL for the given query and search engine
 */
export function getSearchUrl(query: string, engineId: SearchEngineId = DEFAULT_SEARCH_ENGINE): string {
  const engine = SEARCH_ENGINES[engineId] || SEARCH_ENGINES[DEFAULT_SEARCH_ENGINE];
  return engine.urlTemplate.replace('{query}', encodeURIComponent(query));
}

/**
 * Generate a search query for finding a replacement resource.
 * Uses site:domain.tld format to help find content on the same site.
 */
export function generateResourceSearchQuery(title: string, url: string): string {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    return `site:${domain} ${title}`;
  } catch {
    return title;
  }
}

/**
 * Get the full search URL for a broken resource
 */
export function getResourceSearchUrl(
  title: string,
  url: string,
  engineId: SearchEngineId = DEFAULT_SEARCH_ENGINE
): string {
  const query = generateResourceSearchQuery(title, url);
  return getSearchUrl(query, engineId);
}
