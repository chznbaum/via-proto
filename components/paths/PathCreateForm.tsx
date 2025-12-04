'use client';

import { useState, useEffect } from 'react';
import TopicTypeahead, { Topic } from './TopicTypeahead';
import { GroupedModelSelector } from '@/components/ui/ModelSelector';
import { AccountSelector } from './AccountSelector';

interface Account {
  id: string;
  name: string;
  account_type: "personal" | "team";
  subscription_tier: string;
  seat_count: number;
  paths_this_month: number;
}

interface PathCreateFormProps {
  onSuccess?: (formData: any) => void;
  onCancel?: () => void;
  subscriptionTier: 'free' | 'pro' | 'team';
  accounts?: Account[];
  defaultAccountId?: string;
}

export default function PathCreateForm({
  onSuccess,
  onCancel,
  subscriptionTier,
  accounts,
  defaultAccountId,
}: PathCreateFormProps) {
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    topic_id: '',
    topicName: '',
    is_public: false,
    model_id: undefined as string | undefined,
    account_id: defaultAccountId || '',
  });

  // Update account_id when defaultAccountId changes
  useEffect(() => {
    if (defaultAccountId && !formData.account_id) {
      setFormData(prev => ({ ...prev, account_id: defaultAccountId }));
    }
  }, [defaultAccountId, formData.account_id]);

  // Get the selected account's tier for visibility and model rules
  const selectedAccount = accounts?.find(a => a.id === formData.account_id);
  const effectiveTier = selectedAccount?.subscription_tier || subscriptionTier;

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
      // Note: skill_level is calculated from user's competency proficiency levels
      const requestBody: any = {
        topic_id: formData.topic_id,
      };

      // Include account_id if user has multiple accounts and selected one
      if (formData.account_id && accounts && accounts.length > 1) {
        requestBody.account_id = formData.account_id;
      }

      if (effectiveTier !== 'free') {
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
        {/* Account Selection - only show when user has multiple accounts */}
        {accounts && accounts.length > 1 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="card-title">Account</div>
              <div className="mt-2">
                <AccountSelector
                  accounts={accounts}
                  selectedAccountId={formData.account_id}
                  onSelect={(accountId) =>
                    setFormData({ ...formData, account_id: accountId })
                  }
                />
              </div>
            </div>
          </div>
        )}

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
                <p className="text-base-content/75 text-xs mt-1">
                  Start typing to search from <span className="font-semibold">hundreds of topics</span> across programming, design, business, and more
                </p>
              </div>
            </fieldset>
          </div>
        </div>

        {/* LLM Model Selection */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="card-title">LLM Model</div>
            <GroupedModelSelector
              value={formData.model_id}
              onChange={(modelId) => setFormData({ ...formData, model_id: modelId })}
              tier={effectiveTier as 'free' | 'pro' | 'team'}
            />
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="card-title">Visibility</div>
            <div className="mt-2">
              {effectiveTier === 'free' ? (
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
                      <span className="block text-sm text-base-content/75">
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
