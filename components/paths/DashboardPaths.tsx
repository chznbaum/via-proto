'use client';

import { useState, useEffect } from 'react';
import PathCard from './PathCard';
import PathCreateForm from './PathCreateForm';

type ViewMode = 'my' | 'team' | 'public';

interface DashboardPathsProps {
  userId: string;
  accountId: string;
  subscriptionTier: string;
  pathsGeneratedThisCycle: number;
  accountType: string;
  seatCount: number;
}

export default function DashboardPaths({
  userId,
  accountId,
  subscriptionTier,
  pathsGeneratedThisCycle,
  accountType,
  seatCount,
}: DashboardPathsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('my');
  const [paths, setPaths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getRateLimit = (tier: string, seats: number) => {
    if (tier === 'free') return 1;
    if (tier === 'pro') return 5;
    if (tier === 'team') {
      // Team: 10 base + 3 per additional seat beyond minimum 2
      const additionalSeats = Math.max(0, seats - 2);
      return 10 + (additionalSeats * 3);
    }
    return 1; // Default to free tier limit
  };

  const limit = getRateLimit(subscriptionTier, seatCount);
  const remaining = Math.max(0, limit - pathsGeneratedThisCycle);
  const canGenerate = remaining > 0;

  useEffect(() => {
    fetchPaths();
  }, [viewMode]);

  const fetchPaths = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/paths?view=${viewMode}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setPaths(data.paths);
      }
    } catch (error) {
      console.error('Error fetching paths:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePathCreated = (pathId: string) => {
    setShowCreateForm(false);
    fetchPaths(); // Refresh the list
  };

  const handlePathDeleted = (pathId: string) => {
    setPaths((prev) => prev.filter((p) => p.id !== pathId));
  };

  return (
    <div className="space-y-6">
      {/* Header with generation counter and CTA */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Learning Paths
          </h1>
          <p className="text-base-content/60 mt-2">
            {canGenerate ? (
              <>
                {remaining} of {limit} paths remaining this month
              </>
            ) : (
              <>Monthly limit reached. Upgrade for more paths.</>
            )}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
          disabled={!canGenerate}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Path
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Create a New Learning Path
            </h3>
            <PathCreateForm
              onSuccess={handlePathCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button
          className={`tab ${viewMode === 'my' ? 'tab-active' : ''}`}
          onClick={() => setViewMode('my')}
        >
          My Paths
        </button>
        {accountType === 'team' && (
          <button
            className={`tab ${viewMode === 'team' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('team')}
          >
            Team Paths
          </button>
        )}
        <button
          className={`tab ${viewMode === 'public' ? 'tab-active' : ''}`}
          onClick={() => setViewMode('public')}
        >
          Browse Public
        </button>
      </div>

      {/* Paths Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : paths.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base-content/60">
            {viewMode === 'my'
              ? 'You haven\'t created any paths yet. Click "Create Path" to get started!'
              : viewMode === 'team'
              ? 'No team paths found.'
              : 'No public paths available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              isOwner={viewMode === 'my' || path.creator_id === userId}
              onDelete={handlePathDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
