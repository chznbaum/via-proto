"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface ReplacementCandidate {
  title: string;
  url: string;
  type: string;
  is_free: boolean | null;
  description: string;
  relevance_score: number;
}

interface ReplacementSuggestionsModalProps {
  pathId: string;
  resourceId: string;
  resourceTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReplace: (suggestion: ReplacementCandidate) => void;
}

const resourceTypeIcons: Record<string, string> = {
  video: "tabler--video",
  article: "tabler--file-text",
  book: "tabler--book",
  project: "tabler--tool",
  audio: "tabler--headphones",
  graphic: "tabler--palette",
  course: "tabler--school",
};

export const ReplacementSuggestionsModal = ({
  pathId,
  resourceId,
  resourceTitle,
  isOpen,
  onClose,
  onReplace,
}: ReplacementSuggestionsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ReplacementCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Reset state when resourceId changes
  useEffect(() => {
    setIsLoading(false);
    setSuggestions([]);
    setSelectedIndex(null);
    setError(null);
    setHasLoaded(false);
  }, [resourceId]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/paths/${pathId}/resources/${resourceId}/suggestions`,
        { method: "POST" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplace = async () => {
    if (selectedIndex === null) return;

    const suggestion = suggestions[selectedIndex];
    setIsLoading(true);

    try {
      // Update the resource with the selected replacement
      const response = await fetch(
        `/api/paths/${pathId}/resources/${resourceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: suggestion.title,
            url: suggestion.url,
            type: suggestion.type,
            is_free: suggestion.is_free,
            description: suggestion.description,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to replace resource");
      }

      toast.success("Resource replaced successfully");
      onReplace(suggestion);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to replace resource");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedIndex(null);
    setSuggestions([]);
    setError(null);
    setHasLoaded(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={handleClose}
        >
          <span className="iconify lucide--x size-4" />
        </button>

        <h3 className="font-bold text-lg mb-2">Find Replacement Resource</h3>
        <p className="text-base-content/70 text-sm mb-4">
          AI-powered suggestions for replacing &quot;{resourceTitle}&quot;
        </p>

        {!hasLoaded && !isLoading && (
          <div className="text-center py-8">
            <p className="text-base-content/70 mb-4">
              Generate AI-powered replacement suggestions based on the original resource.
            </p>
            <button
              className="btn btn-primary gap-2"
              onClick={loadSuggestions}
            >
              <span className="iconify lucide--sparkles size-4" />
              Generate Suggestions
            </button>
          </div>
        )}

        {isLoading && !hasLoaded && (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-base-content/70 mt-4">
              Searching for replacement resources...
            </p>
            <p className="text-base-content/50 text-sm mt-1">
              This may take 10-30 seconds
            </p>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <span className="iconify lucide--alert-circle size-4" />
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={loadSuggestions}>
              Retry
            </button>
          </div>
        )}

        {hasLoaded && suggestions.length === 0 && !error && (
          <div className="text-center py-8">
            <span className="iconify lucide--search-x size-12 text-base-content/30 mb-4" />
            <p className="text-base-content/70">
              No replacement suggestions found. Try searching the web instead.
            </p>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`card bg-base-200 cursor-pointer transition-all ${
                  selectedIndex === index
                    ? "ring-2 ring-primary bg-primary/10"
                    : "hover:bg-base-300"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <div className="card-body p-4">
                  <div className="flex items-start gap-3">
                    {/* Selection indicator */}
                    <div className="mt-1">
                      <div
                        className={`size-5 rounded-full border-2 flex items-center justify-center ${
                          selectedIndex === index
                            ? "border-primary bg-primary"
                            : "border-base-content/30"
                        }`}
                      >
                        {selectedIndex === index && (
                          <span className="iconify lucide--check size-3 text-primary-content" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title and type */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium line-clamp-2">
                          {suggestion.title}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`badge badge-sm ${
                              suggestion.is_free
                                ? "badge-success"
                                : suggestion.is_free === false
                                ? "badge-warning"
                                : "badge-ghost"
                            }`}
                          >
                            {suggestion.is_free
                              ? "Free"
                              : suggestion.is_free === false
                              ? "Paid"
                              : "Unknown"}
                          </span>
                          <span className="badge badge-sm gap-1 capitalize">
                            <span
                              className={`iconify ${
                                resourceTypeIcons[suggestion.type] || "tabler--link"
                              } size-3`}
                            />
                            {suggestion.type}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-base-content/70 line-clamp-2 mb-2">
                        {suggestion.description}
                      </p>

                      {/* URL preview */}
                      <div className="flex items-center gap-2 text-xs text-base-content/50">
                        <span className="iconify lucide--link size-3" />
                        <span className="truncate">
                          {(() => {
                            try {
                              return new URL(suggestion.url).hostname.replace(
                                /^www\./,
                                ""
                              );
                            } catch {
                              return suggestion.url;
                            }
                          })()}
                        </span>
                        <a
                          href={suggestion.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-ghost gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Preview
                          <span className="iconify lucide--external-link size-3" />
                        </a>
                      </div>

                      {/* Relevance score */}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-base-content/50">Match:</span>
                        <div className="flex gap-0.5">
                          {[...Array(10)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-1.5 rounded-sm ${
                                i < suggestion.relevance_score
                                  ? "bg-primary"
                                  : "bg-base-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-base-content/50">
                          {suggestion.relevance_score}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          {suggestions.length > 0 && (
            <button
              className="btn btn-primary gap-2"
              disabled={selectedIndex === null || isLoading}
              onClick={handleReplace}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <span className="iconify lucide--replace size-4" />
              )}
              Replace Resource
            </button>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
};
