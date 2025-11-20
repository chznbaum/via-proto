'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopicTypeahead, { Topic } from './TopicTypeahead';
import { GroupedModelSelector } from '@/components/ui/ModelSelector';

interface PathCreateFormProps {
  onSuccess?: (formData: any) => void;
  onCancel?: () => void;
  subscriptionTier: 'free' | 'pro' | 'team';
}

export default function PathCreateForm({
  onSuccess,
  onCancel,
  subscriptionTier,
}: PathCreateFormProps) {
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    topic_id: '',
    topicName: '',
    skill_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    is_public: false,
    model_id: undefined as string | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.topic_id) {
        throw new Error('Please select a topic');
      }

      // Prepare the request body
      // For free tier: don't send is_public (backend defaults to true)
      // For pro/team: send user's choice
      const requestBody: any = {
        topic_id: formData.topic_id,
        skill_level: formData.skill_level,
      };

      if (subscriptionTier !== 'free') {
        requestBody.is_public = formData.is_public;
      }

      // Include selected model if user chose one
      if (formData.model_id) {
        requestBody.model_id = formData.model_id;
      }

      // Pass the form data to parent component for multi-step generation
      if (onSuccess) {
        onSuccess(requestBody);
      } else {
        // Fallback: if no onSuccess handler, this shouldn't happen
        console.error('No onSuccess handler provided to PathCreateForm');
      }
    } catch (err) {
      console.error('Error validating form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error mb-4">
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

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {/* Topic Selection */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="card-title">Topic Selection</div>
            <fieldset className="fieldset mt-2 gap-4">
              <div className="space-y-2">
                <label className="fieldset-label" htmlFor="topic">
                  What do you want to learn?
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
                />
                <p className="text-base-content/60 text-xs mt-1">
                  Start typing to search from <span className="font-semibold">hundreds of topics</span> across programming, design, business, and more
                </p>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Path Settings */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="card-title">Path Settings</div>
            <fieldset className="fieldset mt-2 gap-4">
              <div className="space-y-2">
                <label className="fieldset-label" htmlFor="skill-level">
                  Skill Level
                </label>
                <select
                  className="select w-full"
                  id="skill-level"
                  value={formData.skill_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skill_level: e.target.value as any,
                    })
                  }
                >
                  <option value="beginner">Beginner - I'm new to this</option>
                  <option value="intermediate">
                    Intermediate - I have some experience
                  </option>
                  <option value="advanced">Advanced - I want to master this</option>
                </select>
              </div>
            </fieldset>
          </div>
        </div>

        {/* AI Model Selection */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="card-title">AI Model</div>
            <div className="mt-2">
              <GroupedModelSelector
                value={formData.model_id}
                onChange={(modelId) => setFormData({ ...formData, model_id: modelId })}
                tier={subscriptionTier}
              />
            </div>
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="card-title">Visibility</div>
            <div className="mt-2">
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
                    Free tier paths are always public. Upgrade to Pro or Team for private paths.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    id="is-public"
                    checked={formData.is_public}
                    onChange={(e) =>
                      setFormData({ ...formData, is_public: e.target.checked })
                    }
                  />
                  <label className="label cursor-pointer" htmlFor="is-public">
                    <span className="label-text">
                      <span className="font-semibold">Make this path public</span>
                      <span className="block text-sm text-base-content/60">
                        Public paths can be viewed by anyone
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onCancel}
          >
            <span className="iconify lucide--x size-4" />
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={!formData.topic_id}
        >
          <span className="iconify lucide--sparkles size-4" />
          Generate Learning Path
        </button>
      </div>
    </form>
  );
}
