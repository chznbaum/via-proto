"use client";

import { useRef, useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  topic_name: string;
  skill_level: string;
  is_public: boolean;
}

export const TopbarSearchButton = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const showModal = () => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const closeModal = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
      setSearchQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  };

  // Search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('id, title, description, is_public, skill_level, topic:topics(name)')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        const formattedResults: SearchResult[] = (data || []).map((path: any) => ({
          id: path.id,
          title: path.title,
          description: path.description,
          topic_name: path.topic?.name || 'Unknown',
          skill_level: path.skill_level,
          is_public: path.is_public,
        }));
        setResults(formattedResults);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      window.location.href = `/paths/${results[selectedIndex].id}`;
    }
  };

  return (
    <>
      <button
        className="btn btn-outline btn-sm btn-ghost border-base-300 text-base-content/70 hidden h-9 w-48 justify-start gap-2 !text-sm md:flex"
        onClick={showModal}>
        <span className="iconify lucide--search size-4" />
        <span>Search</span>
      </button>
      <button
        className="btn btn-outline btn-sm btn-square btn-ghost border-base-300 text-base-content/70 flex size-9 md:hidden"
        aria-label="Search"
        onClick={showModal}>
        <span className="iconify lucide--search size-4" />
      </button>
      <dialog ref={dialogRef} className="modal p-0">
        <div className="modal-box bg-transparent p-0 shadow-none max-w-2xl">
          <div className="bg-base-100 rounded-box">
            <div className="input w-full border-0 !outline-none">
              <span className="iconify lucide--search text-base-content/75 size-4.5" />
              <input
                ref={inputRef}
                type="search"
                className="grow"
                placeholder="Search learning paths..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="btn btn-xs btn-circle btn-ghost"
                aria-label="Close"
                onClick={closeModal}>
                <span className="iconify lucide--x text-base-content/80 size-4" />
              </button>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="border-base-300 border-t max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center p-8">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <Link
                        key={result.id}
                        href={`/paths/${result.id}`}
                        onClick={closeModal}
                        className={`flex flex-col gap-1 px-4 py-3 hover:bg-base-200 transition-colors ${
                          index === selectedIndex ? 'bg-base-200' : ''
                        }`}>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{result.title}</p>
                          {!result.is_public && (
                            <span className="badge badge-xs">Private</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-base-content/75">
                          <span>{result.topic_name}</span>
                          <span>•</span>
                          <span className="capitalize">{result.skill_level}</span>
                        </div>
                        {result.description && (
                          <p className="text-xs text-base-content/70 line-clamp-1">
                            {result.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <span className="iconify lucide--search size-8 text-base-content/30 mb-2"></span>
                    <p className="text-sm text-base-content/75">No learning paths found</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-base-300 flex items-center gap-3 border-t px-2 py-2">
              <div className="flex items-center gap-0.5">
                <div className="border-base-300 bg-base-200 flex size-5 items-center justify-center rounded-sm border shadow-xs">
                  <span className="iconify lucide--arrow-up size-3.5"></span>
                </div>
                <div className="border-base-300 bg-base-200 flex size-5 items-center justify-center rounded-sm border shadow-xs">
                  <span className="iconify lucide--arrow-down size-3.5"></span>
                </div>
                <p className="text-base-content/80 ms-1 text-sm">Navigate</p>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="border-base-300 bg-base-200 flex size-5 items-center justify-center rounded-sm border shadow-xs">
                  <span className="iconify lucide--corner-down-left size-3.5"></span>
                </div>
                <p className="text-base-content/80 ms-1 text-sm">Open</p>
              </div>
              <div className="ms-auto flex items-center gap-0.5">
                <div className="border-base-300 bg-base-200 flex h-5 items-center justify-center rounded-sm border px-1 text-sm/none shadow-xs">
                  esc
                </div>
                <p className="text-base-content/80 ms-1 text-sm">Close</p>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop" onClick={closeModal} />
      </dialog>
    </>
  );
};
