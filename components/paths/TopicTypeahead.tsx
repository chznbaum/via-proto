'use client';

import { useState, useEffect, useRef } from 'react';

export interface Topic {
  id: string;
  name: string;
  slug: string;
  category: string;
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
  const [topics, setTopics] = useState<Topic[]>([]);
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
      setTopics([]);
      setIsOpen(false);
      return;
    }

    // Set loading state immediately
    setIsLoading(true);

    // Debounce the search
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/topics?q=${encodeURIComponent(query)}&limit=20`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }

        const data = await response.json();
        setTopics(data.topics || []);
        setIsOpen(true);
        setHighlightedIndex(0);
      } catch (error) {
        console.error('Error fetching topics:', error);
        setTopics([]);
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

  const handleSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setQuery(topic.name);
    setIsOpen(false);
    onSelect(topic.id, topic);
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
          prev < topics.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (topics[highlightedIndex]) {
          handleSelect(topics[highlightedIndex]);
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
      {isOpen && topics.length > 0 && (
        <ul className="menu bg-base-100 w-full rounded-box shadow-lg absolute z-50 mt-1 max-h-60 overflow-y-auto border border-base-300">
          {topics.map((topic, index) => (
            <li key={topic.id}>
              <a
                className={`flex flex-col items-start ${
                  index === highlightedIndex ? 'active' : ''
                }`}
                onClick={() => handleSelect(topic)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-semibold flex-1">{topic.name}</span>
                  <span className="badge badge-sm badge-outline">
                    {topic.category}
                  </span>
                </div>
                {topic.description && (
                  <span className="text-xs text-base-content/60 line-clamp-1">
                    {topic.description}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {isOpen && !isLoading && topics.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-base-100 rounded-box shadow-lg border border-base-300 p-4">
          <p className="text-sm text-base-content/60">
            No topics found for "{query}". Try a different search.
          </p>
        </div>
      )}
    </div>
  );
}
