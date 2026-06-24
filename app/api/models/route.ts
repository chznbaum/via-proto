import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { getUserDefaultAccount } from '@/libs/auth';
import {
  getModelsForTier,
  getFeaturedModelsForTier,
  getModelsByProvider,
  getDefaultModelForTier,
  type SubscriptionTier,
} from '@/libs/models';

/**
 * GET /api/models
 * Get available AI models for the authenticated user's subscription tier
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's default account with tier information
    const accountData = await getUserDefaultAccount(user.id);

    if (!accountData) {
      return NextResponse.json(
        { error: 'No active account found' },
        { status: 400 }
      );
    }

    const { account } = accountData;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const viewMode = searchParams.get('view') || 'all'; // 'all', 'featured', or 'grouped'

    // Allow overriding tier via query param (for account selection in forms).
    // This is safe because /api/paths/initiate validates the chosen model against
    // the catalog and the account's tier (getModelConfig + isModelAllowedForTier)
    // before creating a path.
    const tierParam = searchParams.get('tier');
    const effectiveTier = (tierParam && ['free', 'pro', 'team'].includes(tierParam)
      ? tierParam
      : account.subscription_tier) as SubscriptionTier;

    let models;
    let groupedByProvider;
    const defaultModelId = getDefaultModelForTier(effectiveTier);

    switch (viewMode) {
      case 'featured':
        models = getFeaturedModelsForTier(effectiveTier);
        break;
      case 'grouped':
        groupedByProvider = getModelsByProvider(effectiveTier);
        break;
      case 'all':
      default:
        models = getModelsForTier(effectiveTier);
        break;
    }

    return NextResponse.json({
      tier: effectiveTier,
      defaultModelId,
      ...(groupedByProvider ? { modelsByProvider: groupedByProvider } : { models }),
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
