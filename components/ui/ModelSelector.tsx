"use client";

import { useState, useEffect } from "react";
import type { ModelConfig, SubscriptionTier } from "@/libs/models";
import { getCostTierBadgeColor, getCostTierDisplay } from "@/libs/models";

interface ModelSelectorProps {
  value?: string;
  onChange: (modelId: string) => void;
  tier?: SubscriptionTier;
  disabled?: boolean;
  showDescription?: boolean;
  viewMode?: "simple" | "grouped" | "featured";
  className?: string;
}

interface ModelsResponse {
  tier: SubscriptionTier;
  defaultModelId: string;
  models?: ModelConfig[];
  modelsByProvider?: Record<string, ModelConfig[]>;
}

export function ModelSelector({
  value,
  onChange,
  tier,
  disabled = false,
  showDescription = false,
  viewMode = "featured",
  className = "",
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [groupedModels, setGroupedModels] = useState<Record<string, ModelConfig[]> | null>(null);
  const [defaultModelId, setDefaultModelId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        setLoading(true);
        const response = await fetch(`/api/models?view=${viewMode === "grouped" ? "grouped" : viewMode}`);

        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }

        const data: ModelsResponse = await response.json();
        setDefaultModelId(data.defaultModelId);

        if (data.modelsByProvider) {
          setGroupedModels(data.modelsByProvider);
          // Flatten for the dropdown
          const allModels = Object.values(data.modelsByProvider).flat();
          setModels(allModels);
        } else if (data.models) {
          setModels(data.models);
        }

        // Set default value if no value is provided
        if (!value && data.defaultModelId) {
          onChange(data.defaultModelId);
        }
      } catch (err) {
        console.error("Error fetching models:", err);
        setError("Failed to load models");
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, [viewMode, value, onChange]);

  const selectedModel = models.find((m) => m.id === value);

  if (loading) {
    return (
      <fieldset className={`fieldset ${className}`}>
        <label className="fieldset-label" htmlFor="model-select">
          Which model should we use?
        </label>
        <div className="skeleton h-12 w-full"></div>
      </fieldset>
    );
  }

  if (error) {
    return (
      <fieldset className={`fieldset ${className}`}>
        <label className="fieldset-label" htmlFor="model-select">
          Which model should we use?
        </label>
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </fieldset>
    );
  }

  if (viewMode === "grouped" && groupedModels) {
    return (
      <fieldset className={`fieldset ${className}`}>
        <label className="fieldset-label" htmlFor="model-select">
          Which model should we use?
        </label>
        <select
          id="model-select"
          className="select select-bordered w-full"
          value={value || defaultModelId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <optgroup key={provider} label={provider}>
              {providerModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {model.costTier !== "free" && ` (${getCostTierDisplay(model.costTier)})`}
                  {model.featured && " ⭐"}
                  {model.isReasoningModel && " 🧠"}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {showDescription && selectedModel && (
          <span className="text-base-content/75 text-xs mt-1">{selectedModel.description}</span>
        )}
      </fieldset>
    );
  }

  return (
    <fieldset className={`fieldset ${className}`}>
      <label className="fieldset-label" htmlFor="model-select-simple">
        Which model should we use?
      </label>
      <select
        id="model-select-simple"
        className="select select-bordered w-full"
        value={value || defaultModelId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({model.provider})
            {model.costTier !== "free" && ` - ${getCostTierDisplay(model.costTier)}`}
            {model.featured && " ⭐"}
            {model.isReasoningModel && " 🧠"}
          </option>
        ))}
      </select>
      {showDescription && selectedModel && (
        <span className="text-base-content/75 text-xs mt-1">{selectedModel.description}</span>
      )}
      {selectedModel && (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`badge ${getCostTierBadgeColor(selectedModel.costTier)}`}>
            {getCostTierDisplay(selectedModel.costTier)}
          </span>
          {selectedModel.isReasoningModel && (
            <span className="badge badge-info">Reasoning</span>
          )}
          {selectedModel.featured && (
            <span className="badge badge-warning">Featured</span>
          )}
        </div>
      )}
    </fieldset>
  );
}

/**
 * Compact model selector for use in forms
 */
export function CompactModelSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: Pick<ModelSelectorProps, "value" | "onChange" | "disabled" | "className">) {
  return (
    <ModelSelector
      value={value}
      onChange={onChange}
      disabled={disabled}
      viewMode="featured"
      showDescription={false}
      className={className}
    />
  );
}

/**
 * Advanced model selector with grouping by provider
 */
export function GroupedModelSelector({
  value,
  onChange,
  tier,
  disabled = false,
  className = "",
}: Pick<ModelSelectorProps, "value" | "onChange" | "tier" | "disabled" | "className">) {
  return (
    <ModelSelector
      value={value}
      onChange={onChange}
      tier={tier}
      disabled={disabled}
      viewMode="grouped"
      showDescription={true}
      className={className}
    />
  );
}
