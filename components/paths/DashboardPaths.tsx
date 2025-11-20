'use client';

import { useState, useEffect, useCallback } from 'react';
import PathCard from './PathCard';
import PathCreateForm from './PathCreateForm';
import { UsageStatsBar } from './UsageStatsBar';
import { GeneratingPathCard } from './GeneratingPathCard';
import { toast } from 'react-hot-toast';

type ViewMode = 'my' | 'team' | 'public';

interface DashboardPathsProps {
  userId: string;
  accountId: string;
  subscriptionTier: string;
  pathsGeneratedThisCycle: number;
  accountType: string;
  seatCount: number;
}

interface GeneratingPath {
  pathId: string;
  topicName: string;
  status: 'pending' | 'generating_metadata' | 'fetching_image' | 'curating_resources' | 'completed' | 'failed';
  error?: string;
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
  const [generatingPaths, setGeneratingPaths] = useState<GeneratingPath[]>([]);
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const getRateLimit = (tier: string, seats: number) => {
    if (tier === 'free') return 1;
    if (tier === 'pro') return 5;
    if (tier === 'team') {
      const additionalSeats = Math.max(0, seats - 2);
      return 10 + (additionalSeats * 3);
    }
    return 1;
  };

  const limit = getRateLimit(subscriptionTier, seatCount);
  const remaining = Math.max(0, limit - pathsGeneratedThisCycle);
  const canGenerate = remaining > 0;

  useEffect(() => {
    fetchPaths();
  }, [viewMode]);

  useEffect(() => {
    // Cleanup polling intervals on unmount
    return () => {
      pollingIntervals.forEach((interval) => clearInterval(interval));
    };
  }, [pollingIntervals]);

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
      toast.error('Failed to load paths');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPathStatus = useCallback(async (pathId: string) => {
    try {
      const response = await fetch(`/api/paths/${pathId}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();

      setGeneratingPaths((prev) =>
        prev.map((p) =>
          p.pathId === pathId
            ? { ...p, status: data.status, error: data.error }
            : p
        )
      );

      // If completed or failed, stop polling and refresh paths
      if (data.status === 'completed' || data.status === 'failed') {
        const interval = pollingIntervals.get(pathId);
        if (interval) {
          clearInterval(interval);
          setPollingIntervals((prev) => {
            const newMap = new Map(prev);
            newMap.delete(pathId);
            return newMap;
          });
        }

        if (data.status === 'completed') {
          toast.success('Learning path generated successfully!');
          // Remove from generating paths after a short delay
          setTimeout(() => {
            setGeneratingPaths((prev) => prev.filter((p) => p.pathId !== pathId));
            fetchPaths();
          }, 2000);
        } else {
          toast.error(data.error || 'Path generation failed');
        }
      }
    } catch (error) {
      console.error('Error polling path status:', error);
    }
  }, [pollingIntervals]);

  const startPathGeneration = async (formData: any) => {
    try {
      // Step 1: Initiate path creation
      const initiateResponse = await fetch('/api/paths/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!initiateResponse.ok) {
        const error = await initiateResponse.json();
        throw new Error(error.error || 'Failed to initiate path');
      }

      const { pathId, topicName } = await initiateResponse.json();

      // Add to generating paths
      setGeneratingPaths((prev) => [
        ...prev,
        { pathId, topicName, status: 'pending' },
      ]);

      // Close modal
      setShowCreateForm(false);

      toast.success('Starting path generation...');

      // Step 2: Trigger content generation (async)
      fetch(`/api/paths/${pathId}/generate-content`, {
        method: 'POST',
      }).catch((error) => {
        console.error('Error triggering generation:', error);
      });

      // Step 3: Start polling for status
      const interval = setInterval(() => {
        pollPathStatus(pathId);
      }, 2000); // Poll every 2 seconds

      setPollingIntervals((prev) => new Map(prev).set(pathId, interval));

    } catch (error) {
      console.error('Error starting path generation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
    }
  };

  const handleCancelGeneration = (pathId: string) => {
    // Stop polling
    const interval = pollingIntervals.get(pathId);
    if (interval) {
      clearInterval(interval);
      setPollingIntervals((prev) => {
        const newMap = new Map(prev);
        newMap.delete(pathId);
        return newMap;
      });
    }

    // Remove from generating paths
    setGeneratingPaths((prev) => prev.filter((p) => p.pathId !== pathId));

    toast.success('Generation cancelled');
  };

  const handlePathDeleted = (pathId: string) => {
    setPaths((prev) => prev.filter((p) => p.id !== pathId));
    toast.success('Path deleted successfully');
  };

  return (
    <div className="space-y-6">
      {/* Usage Stats */}
      <UsageStatsBar
        pathsUsed={pathsGeneratedThisCycle}
        pathsLimit={limit}
        subscriptionTier={subscriptionTier}
      />

      {/* Header with CTA */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Learning Paths
          </h1>
          <p className="text-base-content/60 mt-2">
            {canGenerate ? (
              <>
                Create personalized learning paths powered by AI
              </>
            ) : (
              <>Monthly limit reached. <a href="/pricing" className="link">Upgrade</a> for more paths.</>
            )}
          </p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => setShowCreateForm(true)}
          disabled={!canGenerate}
        >
          <span className="iconify lucide--plus size-5"></span>
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
              onSuccess={startPathGeneration}
              onCancel={() => setShowCreateForm(false)}
              subscriptionTier={subscriptionTier as 'free' | 'pro' | 'team'}
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
          <span className="iconify lucide--user size-4 mr-2"></span>
          My Paths
        </button>
        {accountType === 'team' && (
          <button
            className={`tab ${viewMode === 'team' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('team')}
          >
            <span className="iconify lucide--users size-4 mr-2"></span>
            Team Paths
          </button>
        )}
        <button
          className={`tab ${viewMode === 'public' ? 'tab-active' : ''}`}
          onClick={() => setViewMode('public')}
        >
          <span className="iconify lucide--globe size-4 mr-2"></span>
          Browse Public
        </button>
      </div>

      {/* Generating Paths */}
      {generatingPaths.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Generating...</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatingPaths.map((genPath) => (
              <GeneratingPathCard
                key={genPath.pathId}
                pathId={genPath.pathId}
                topicName={genPath.topicName}
                status={genPath.status}
                error={genPath.error}
                onCancel={handleCancelGeneration}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Paths Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : paths.length === 0 && generatingPaths.length === 0 ? (
        <div className="text-center py-12">
          <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
            <div className="card-body items-center text-center">
              <span className="iconify lucide--map size-16 text-base-content/20"></span>
              <h3 className="card-title">No paths yet</h3>
              <p className="text-base-content/60">
                {viewMode === 'my'
                  ? 'Create your first learning path to get started!'
                  : viewMode === 'team'
                  ? 'No team paths found.'
                  : 'No public paths available.'}
              </p>
              {viewMode === 'my' && canGenerate && (
                <button
                  className="btn btn-primary mt-4"
                  onClick={() => setShowCreateForm(true)}
                >
                  Create Your First Path
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {paths.length > 0 && (
            <>
              <h2 className="text-xl font-bold">
                {viewMode === 'my' ? 'My Learning Paths' : viewMode === 'team' ? 'Team Learning Paths' : 'Public Learning Paths'}
              </h2>
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
            </>
          )}
        </>
      )}
    </div>
  );
}
