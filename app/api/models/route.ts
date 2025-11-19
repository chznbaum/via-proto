import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { getUserDefaultAccount } from '@/libs/auth';
import {
  getModelsForTier,
  getFeaturedModelsForTier,
  getModelsByProvider,
  getDefaultModelForTier,
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

    let models;
    let groupedByProvider;
    const defaultModelId = getDefaultModelForTier(account.subscription_tier);

    switch (viewMode) {
      case 'featured':
        models = getFeaturedModelsForTier(account.subscription_tier);
        break;
      case 'grouped':
        groupedByProvider = getModelsByProvider(account.subscription_tier);
        break;
      case 'all':
      default:
        models = getModelsForTier(account.subscription_tier);
        break;
    }

    return NextResponse.json({
      tier: account.subscription_tier,
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
