/**
 * Model Configuration for OpenRouter
 * Defines all available AI models for learning path generation
 */

export type SubscriptionTier = "free" | "pro" | "team";
export type CostTier = "free" | "low" | "medium" | "high" | "premium";
export type ModelProvider =
  | "Anthropic"
  | "Google"
  | "OpenAI"
  | "DeepSeek"
  | "Qwen"
  | "Z-AI"
  | "Meta"
  | "Mistral"
  | "Perplexity"
  | "Amazon"
  | "Moonshot";

export interface ModelConfig {
  /** OpenRouter model ID */
  id: string;
  /** Display name for UI */
  name: string;
  /** Model provider */
  provider: ModelProvider;
  /** Minimum subscription tier required */
  minimumTier: SubscriptionTier;
  /** Cost tier indicator */
  costTier: CostTier;
  /** Supports web search via OpenRouter transforms */
  supportsWebSearch: boolean;
  /** Supports structured JSON output */
  supportsStructuredOutput: boolean;
  /** Short description of model's strengths */
  description: string;
  /** Whether this is a featured/recommended model */
  featured?: boolean;
  /** Whether this is a reasoning/thinking model variant */
  isReasoningModel?: boolean;
}

/**
 * Complete model catalog
 *
 * Every ID below is verified against the live OpenRouter `/v1/models` catalog and
 * supports structured/JSON output. The generation pipeline applies the OpenRouter
 * `web-search` transform to every model, so `supportsWebSearch` is informational.
 */
export const MODEL_CATALOG: ModelConfig[] = [
  // ==================== FREE TIER MODELS ====================

  {
    id: "deepseek/deepseek-chat-v3.1",
    name: "DeepSeek Chat v3.1",
    provider: "DeepSeek",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Latest version with improved reasoning",
    featured: true,
  },
  // DeepSeek (Free)
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "General-purpose reasoning model with strong capabilities",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Advanced reasoning model",
    isReasoningModel: true,
  },

  // Qwen (Free)
  {
    id: "qwen/qwen3-coder-30b-a3b-instruct",
    name: "Qwen3 Coder 30B",
    provider: "Qwen",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Coding-focused model with strong technical capabilities",
    featured: true,
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct",
    name: "Qwen3 Next 80B",
    provider: "Qwen",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Current general-purpose Qwen with an efficient MoE architecture",
  },

  // Google Gemini (Free)
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "Google",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Lightweight, low-cost Gemini with 1M token context",
    featured: true,
  },

  // Z-AI (Free)
  {
    id: "z-ai/glm-4.6",
    name: "GLM 4.6",
    provider: "Z-AI",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "General-purpose model with strong reasoning",
  },

  // Meta (Free)
  {
    id: "meta-llama/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B Instruct",
    provider: "Meta",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Open-source model for experimentation",
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Meta",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Meta's Llama 4 Maverick — capable open model with very large context",
  },

  // Moonshot Kimi (Free)
  {
    id: "moonshotai/kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    provider: "Moonshot",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Reasoning-focused model with extended context",
    featured: true,
    isReasoningModel: true,
  },

  // ==================== PRO/TEAM TIER MODELS ====================

  // Anthropic Claude
  {
    id: "anthropic/claude-opus-4.8",
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description:
      "Latest, most capable Opus with 1M context — exceptional for complex reasoning and agentic curation",
    featured: true,
  },
  {
    id: "anthropic/claude-opus-4.7",
    name: "Claude Opus 4.7",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description:
      "Prior Opus point release with 1M context — an alternative to 4.5 and 4.8",
  },
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description:
      "Highly capable Opus with 200K context, excellent for complex reasoning and agentic workflows",
    featured: true,
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "medium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description:
      "Latest Sonnet with 1M context — excellent balance of intelligence and cost",
    featured: true,
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "medium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description:
      "Excellent balance of intelligence and cost for coding and analysis",
    featured: true,
  },
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Fast, low-cost Claude with a strong quality-to-speed ratio",
    featured: true,
  },

  // Google Gemini
  {
    id: "google/gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Latest Gemini 3 Pro with 1M token context and advanced reasoning",
    featured: true,
  },
  {
    id: "google/gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "Google",
    minimumTier: "pro",
    costTier: "medium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Newest Gemini Flash — fast and capable with 1M token context",
    featured: true,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    minimumTier: "pro",
    costTier: "high",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Top reasoning model with 1M token context",
    featured: true,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Price-performance leader optimized for speed",
    featured: true,
  },

  // OpenAI GPT
  {
    id: "openai/gpt-5.5",
    name: "GPT-5.5",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Newest GPT flagship with advanced reasoning and very large context",
    featured: true,
  },
  {
    id: "openai/gpt-5.4",
    name: "GPT-5.4",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "high",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "High-capability GPT-5 series model; strong value below 5.5",
  },
  {
    id: "openai/gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Smaller, budget-friendly GPT-5.4 for fast generations",
  },
  {
    id: "openai/gpt-5.1",
    name: "GPT-5.1",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "GPT-5 series model with advanced capabilities",
    featured: true,
  },
  {
    id: "openai/gpt-5-pro",
    name: "GPT-5 Pro",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Pro-tier GPT-5 with enhanced reasoning",
    featured: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "medium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Multimodal with vision capabilities and 128K context",
    featured: true,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Smaller, faster, budget-friendly version of GPT-4o",
  },
  {
    id: "openai/o1",
    name: "OpenAI o1",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "high",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description:
      "Advanced reasoning model optimized for complex problem-solving",
    featured: true,
    isReasoningModel: true,
  },
  {
    id: "openai/o3",
    name: "OpenAI o3",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Reasoning model with state-of-the-art capabilities",
    featured: true,
    isReasoningModel: true,
  },
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "high",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Vision-capable model with improved performance",
  },

  // DeepSeek (Premium)
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "DeepSeek",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Newer DeepSeek with strong reasoning and tool use",
  },
  {
    id: "deepseek/deepseek-v3.1-terminus",
    name: "DeepSeek V3.1 Terminus",
    provider: "DeepSeek",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Dual think/non-think modes with 128K context for tool use",
  },
  {
    id: "deepseek/deepseek-r1-0528",
    name: "DeepSeek R1 (May 2025)",
    provider: "DeepSeek",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Latest reasoning model from DeepSeek",
    isReasoningModel: true,
  },

  // Qwen (Premium)
  {
    id: "qwen/qwen3-235b-a22b",
    name: "Qwen3 235B A22B",
    provider: "Qwen",
    minimumTier: "pro",
    costTier: "medium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Flagship sparse MoE with thinking/non-thinking modes",
  },
  {
    id: "qwen/qwen3-max",
    name: "Qwen3 Max",
    provider: "Qwen",
    minimumTier: "pro",
    costTier: "medium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Maximum capability Qwen model",
  },

  // Moonshot Kimi (Premium)
  {
    id: "moonshotai/kimi-k2.6",
    name: "Kimi K2.6",
    provider: "Moonshot",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Newer Kimi K2 with large context and strong agentic performance",
  },

  // Z-AI (Premium)
  {
    id: "z-ai/glm-5",
    name: "GLM 5",
    provider: "Z-AI",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Latest GLM flagship with strong general reasoning",
  },

  // Mistral
  {
    id: "mistralai/mistral-large-2512",
    name: "Mistral Large",
    provider: "Mistral",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Mistral's flagship — strong reasoning with 256K context",
  },
];

/**
 * Get default model for a subscription tier
 */
export function getDefaultModelForTier(tier: SubscriptionTier): string {
  if (tier === "free") {
    return "deepseek/deepseek-chat-v3.1";
  }
  return "anthropic/claude-opus-4.8";
}

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | null {
  return MODEL_CATALOG.find((m) => m.id === modelId) || null;
}

/**
 * Get all models available for a subscription tier
 */
export function getModelsForTier(tier: SubscriptionTier): ModelConfig[] {
  if (tier === "free") {
    return MODEL_CATALOG.filter((m) => m.minimumTier === "free");
  }
  // Pro and Team tiers get access to all models
  return MODEL_CATALOG;
}

/**
 * Get only featured models for a subscription tier
 */
export function getFeaturedModelsForTier(
  tier: SubscriptionTier,
): ModelConfig[] {
  return getModelsForTier(tier).filter((m) => m.featured === true);
}

/**
 * Check if a model is allowed for a subscription tier
 */
export function isModelAllowedForTier(
  modelConfig: ModelConfig,
  tier: SubscriptionTier,
): boolean {
  if (tier === "free") {
    return modelConfig.minimumTier === "free";
  }
  // Pro and Team can use any model
  return true;
}

/**
 * Group models by provider
 */
export function getModelsByProvider(
  tier: SubscriptionTier,
): Record<ModelProvider, ModelConfig[]> {
  const models = getModelsForTier(tier);
  const grouped: Record<string, ModelConfig[]> = {};

  models.forEach((model) => {
    if (!grouped[model.provider]) {
      grouped[model.provider] = [];
    }
    grouped[model.provider].push(model);
  });

  return grouped as Record<ModelProvider, ModelConfig[]>;
}

/**
 * Get cost tier badge color for UI
 */
export function getCostTierBadgeColor(costTier: CostTier): string {
  const colors = {
    free: "badge-success",
    low: "badge-info",
    medium: "badge-warning",
    high: "badge-error",
    premium: "badge-secondary",
  };
  return colors[costTier];
}

/**
 * Get cost tier display text
 */
export function getCostTierDisplay(costTier: CostTier): string {
  const display = {
    free: "Free",
    low: "Budget",
    medium: "Standard",
    high: "Premium",
    premium: "Ultra",
  };
  return display[costTier];
}
