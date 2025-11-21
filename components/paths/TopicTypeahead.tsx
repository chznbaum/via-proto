'use client';

import { useState, useEffect, useRef } from 'react';
import type { TopicSearchResult } from '@/types/search';

export interface Topic {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  description: string | null;
}

interface TopicTypeaheadProps {
  onSelect: (topicId: string, topic: Topic) => void;
  placeholder?: string;
  disabled?: boolean;
  initialValue?: string;
}

export default function TopicTypeahead({
  onSelect,
  placeholder = 'Search topics...',
  disabled = false,
  initialValue = '',
}: TopicTypeaheadProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<TopicSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch topics with debounce
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search if query is too short or if a topic is already selected
    if (query.length < 2 || selectedTopic) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Set loading state immediately
    setIsLoading(true);

    // Debounce the search
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=20`
        );

        if (!response.ok) {
          throw new Error('Failed to search topics');
        }

        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
        setHighlightedIndex(0);
      } catch (error) {
        console.error('Error searching topics:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedTopic]);

  const handleSelect = (result: TopicSearchResult) => {
    // Convert TopicSearchResult to Topic interface for backwards compatibility
    const topic: Topic = {
      id: result.topic_id,
      name: result.topic_name,
      slug: result.topic_slug,
      category_id: result.category_id,
      category_name: result.category_name,
      category_slug: result.category_slug,
      description: result.topic_description,
    };
    setSelectedTopic(topic);
    setQuery(result.topic_name);
    setIsOpen(false);
    onSelect(result.topic_id, topic);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    // Clear selection if user types after selecting
    if (selectedTopic) {
      setSelectedTopic(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="form-control w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={`input input-bordered w-full ${
            selectedTopic ? 'input-success' : ''
          }`}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
        />
        {isLoading && (
          <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2"></span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul className="menu bg-base-100 w-full rounded-box shadow-lg absolute z-50 mt-1 max-h-96 overflow-y-auto border border-base-300">
          {results.map((result, index) => (
            <li key={result.topic_id}>
              <a
                className={`flex flex-col items-start py-3 ${
                  index === highlightedIndex ? 'active' : ''
                }`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {/* Topic name */}
                <div className="flex items-center gap-2 w-full mb-1">
                  <span className="font-semibold flex-1">{result.topic_name}</span>
                </div>

                {/* Competencies as chips */}
                {result.all_competency_names && result.all_competency_names.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {result.all_competency_names.map((comp, idx) => (
                      <span
                        key={idx}
                        className={`badge badge-sm ${
                          idx === 0 ? 'badge-primary' : 'badge-ghost'
                        }`}
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {result.topic_description && (
                  <span className="text-xs text-base-content/60 line-clamp-2 mb-1">
                    {result.topic_description}
                  </span>
                )}

                {/* Tags as badges */}
                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="badge badge-xs badge-outline"
                      >
                        🏷️ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {isOpen && !isLoading && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-base-100 rounded-box shadow-lg border border-base-300 p-4">
          <p className="text-sm text-base-content/60">
            No topics found for "{query}". Try a different search.
          </p>
        </div>
      )}
    </div>
  );
}
