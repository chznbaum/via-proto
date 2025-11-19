'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopicTypeahead, { Topic } from './TopicTypeahead';

interface PathCreateFormProps {
  onSuccess?: (pathId: string) => void;
  onCancel?: () => void;
  subscriptionTier: 'free' | 'pro' | 'team';
}

export default function PathCreateForm({
  onSuccess,
  onCancel,
  subscriptionTier,
}: PathCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    topic_id: '',
    topicName: '',
    skill_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    is_public: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.topic_id) {
        throw new Error('Please select a topic');
      }

      // Generate the learning path
      // For free tier: don't send is_public (backend defaults to true)
      // For pro/team: send user's choice
      const requestBody: any = {
        topic_id: formData.topic_id,
        skill_level: formData.skill_level,
      };

      if (subscriptionTier !== 'free') {
        requestBody.is_public = formData.is_public;
      }

      const pathResponse = await fetch('/api/paths/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!pathResponse.ok) {
        const errorData = await pathResponse.json();
        throw new Error(errorData.error || 'Failed to generate path');
      }

      const { path } = await pathResponse.json();

      // Success! Navigate to the path
      if (onSuccess) {
        onSuccess(path.id);
      } else {
        router.push(`/paths/${path.id}`);
      }
    } catch (err) {
      console.error('Error creating path:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">
            What do you want to learn?
          </span>
        </label>
        <TopicTypeahead
          onSelect={(topicId: string, topic: Topic) => {
            setFormData({
              ...formData,
              topic_id: topicId,
              topicName: topic.name,
            });
          }}
          placeholder="Search for a topic (e.g., React, Machine Learning, Spanish)"
          disabled={isLoading}
        />
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            Start typing to search from {' '}
            <span className="font-semibold">hundreds of topics</span> across programming, design, business, and more
          </span>
        </label>
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Skill Level</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={formData.skill_level}
          onChange={(e) =>
            setFormData({
              ...formData,
              skill_level: e.target.value as any,
            })
          }
          disabled={isLoading}
        >
          <option value="beginner">Beginner - I'm new to this</option>
          <option value="intermediate">
            Intermediate - I have some experience
          </option>
          <option value="advanced">Advanced - I want to master this</option>
        </select>
      </div>

      {subscriptionTier === 'free' ? (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Free tier paths are always public. Upgrade to Pro or Team for
            private paths.
          </span>
        </div>
      ) : (
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="checkbox"
              checked={formData.is_public}
              onChange={(e) =>
                setFormData({ ...formData, is_public: e.target.checked })
              }
              disabled={isLoading}
            />
            <span className="label-text">
              <span className="font-semibold">Make this path public</span>
              <span className="block text-sm text-base-content/60">
                Public paths can be viewed by anyone
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={isLoading || !formData.topic_id}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              Generating Path...
            </>
          ) : (
            'Generate Learning Path'
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
