/**
 * TypeScript types for search API
 * Supports searching topics and learning paths (extendable)
 */

export type SearchType = 'topics' | 'paths' | 'all';

// Topic search result
export interface TopicSearchResult {
  type: 'topic';
  topic_id: string;
  topic_name: string;
  topic_slug: string;
  topic_description: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  rank: number;
  primary_competency_name: string | null;
  primary_competency_slug: string | null;
  all_competency_names: string[] | null;
  tags: string[] | null;
}

// Learning path search result (for future implementation)
export interface PathSearchResult {
  type: 'path';
  path_id: string;
  path_title: string;
  path_slug: string;
  path_description: string;
  topic_name: string;
  topic_slug: string;
  skill_level: string;
  creator_name: string | null;
  rank: number;
  tags: string[] | null;
}

// Union type for all search results
export type SearchResult = TopicSearchResult | PathSearchResult;

// API response structure
export interface SearchResponse {
  results: SearchResult[];
  query: string;
  type: SearchType;
  count: number;
}
