'use client';

import { useState, useEffect, useRef } from 'react';

export interface Competency {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: {
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  topics_count?: number;
}

interface CompetencyTypeaheadProps {
  onSelect: (competency: Competency) => void;
  placeholder?: string;
  disabled?: boolean;
  initialValue?: string;
}

export default function CompetencyTypeahead({
  onSelect,
  placeholder = 'Search skills...',
  disabled = false,
  initialValue = '',
}: CompetencyTypeaheadProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
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

  // Fetch competencies with debounce
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search if query is too short or if a competency is already selected
    if (query.length < 2 || selectedCompetency) {
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
          `/api/competencies?q=${encodeURIComponent(query)}&limit=20`
        );

        if (!response.ok) {
          throw new Error('Failed to search competencies');
        }

        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
        setHighlightedIndex(0);
      } catch (error) {
        console.error('Error searching competencies:', error);
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
  }, [query, selectedCompetency]);

  const handleSelect = (result: Competency) => {
    setSelectedCompetency(result);
    setQuery(result.name);
    setIsOpen(false);
    onSelect(result);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    // Clear selection if user types after selecting
    if (selectedCompetency) {
      setSelectedCompetency(null);
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
            selectedCompetency ? 'input-success' : ''
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
            <li key={result.id}>
              <a
                className={`flex flex-col items-start py-3 ${
                  index === highlightedIndex ? 'active' : ''
                }`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {/* Competency name */}
                <div className="flex items-center gap-2 w-full mb-1">
                  {result.category?.icon && (
                    <span className={`iconify ${result.category.icon} size-4`}></span>
                  )}
                  <span className="font-semibold flex-1">{result.name}</span>
                  {result.topics_count !== undefined && result.topics_count > 0 && (
                    <span className="badge badge-sm badge-ghost">
                      {result.topics_count} {result.topics_count === 1 ? 'topic' : 'topics'}
                    </span>
                  )}
                </div>

                {/* Category */}
                {result.category && (
                  <span className="text-xs text-base-content/50 mb-1">
                    {result.category.name}
                  </span>
                )}

                {/* Description */}
                {result.description && (
                  <span className="text-xs text-base-content/60 line-clamp-2">
                    {result.description}
                  </span>
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
            No skills found for "{query}". Try a different search.
          </p>
        </div>
      )}
    </div>
  );
}
