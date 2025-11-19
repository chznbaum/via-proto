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
 */
export const MODEL_CATALOG: ModelConfig[] = [
  // ==================== FREE TIER MODELS ====================

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
    featured: true,
  },
  {
    id: "deepseek/deepseek-chat-v3.1",
    name: "DeepSeek Chat v3.1",
    provider: "DeepSeek",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Latest version with improved reasoning",
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
    id: "qwen/qwen-turbo",
    name: "Qwen Turbo",
    provider: "Qwen",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Fast general-purpose model",
  },

  // Google Gemini (Free)
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    minimumTier: "free",
    costTier: "free",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Multimodal with 1M token context window",
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
    id: "anthropic/claude-sonnet-4.5:thinking",
    name: "Claude Sonnet 4.5 (Reasoning)",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "high",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Extended reasoning mode for complex problem-solving",
    isReasoningModel: true,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "medium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Previous generation Sonnet model",
  },
  {
    id: "anthropic/claude-sonnet-4:thinking",
    name: "Claude Sonnet 4 (Reasoning)",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "high",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Extended reasoning for Sonnet 4",
    isReasoningModel: true,
  },
  {
    id: "anthropic/claude-4.5-haiku",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "3x cheaper and 2x faster than Sonnet 4 for coding tasks",
    featured: true,
  },
  {
    id: "anthropic/claude-3.5-sonnet:thinking",
    name: "Claude 3.5 Sonnet (Reasoning)",
    provider: "Anthropic",
    minimumTier: "pro",
    costTier: "high",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Extended reasoning mode for complex analysis",
    isReasoningModel: true,
  },

  // Google Gemini
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "Google",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Latest Gemini preview with advanced capabilities",
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
    id: "openai/gpt-5.1",
    name: "GPT-5.1",
    provider: "OpenAI",
    minimumTier: "pro",
    costTier: "premium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Latest GPT-5 series model with advanced capabilities",
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
    description: "Latest reasoning model with state-of-the-art capabilities",
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
    name: "DeepSeek R1 (May 2028)",
    provider: "DeepSeek",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Latest reasoning model from DeepSeek",
    isReasoningModel: true,
  },
  {
    id: "deepseek/deepseek-prover-v2",
    name: "DeepSeek Prover V2",
    provider: "DeepSeek",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Specialized for theorem proving in Lean 4",
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
  {
    id: "qwen/qwen3-plus",
    name: "Qwen3 Plus",
    provider: "Qwen",
    minimumTier: "pro",
    costTier: "low",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Balanced performance and cost",
  },

  // Perplexity
  {
    id: "perplexity/sonar-pro",
    name: "Perplexity Sonar Pro",
    provider: "Perplexity",
    minimumTier: "pro",
    costTier: "medium",
    supportsWebSearch: true,
    supportsStructuredOutput: true,
    description: "Web search grounded responses with citations",
  },
];

/**
 * Get default model for a subscription tier
 */
export function getDefaultModelForTier(tier: SubscriptionTier): string {
  if (tier === "free") {
    return "deepseek/deepseek-chat";
  }
  return "anthropic/claude-sonnet-4.5";
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
