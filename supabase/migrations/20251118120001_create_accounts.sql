-- Migration 2: Create Accounts Table
-- Purpose: Billing and subscription entities that users belong to
-- Date: 2025-11-18

-- Create accounts table
CREATE TABLE public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    account_type text NOT NULL DEFAULT 'personal',
    seat_count integer NOT NULL DEFAULT 1,
    subscription_tier text NOT NULL DEFAULT 'free',
    subscription_status text NOT NULL DEFAULT 'inactive',
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text,
    paths_generated_this_cycle integer NOT NULL DEFAULT 0,
    cycle_start_date timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT valid_account_type CHECK (account_type IN ('personal', 'team')),
    CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'pro', 'team')),
    CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'inactive')),
    CONSTRAINT valid_seat_count CHECK (seat_count >= 1),
    CONSTRAINT personal_account_single_seat CHECK (
        (account_type = 'personal' AND seat_count = 1) OR account_type = 'team'
    )
);

-- Create indexes
CREATE INDEX idx_accounts_slug ON public.accounts(slug);
CREATE INDEX idx_accounts_stripe_customer_id ON public.accounts(stripe_customer_id);
CREATE INDEX idx_accounts_account_type ON public.accounts(account_type);

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added in Migration 3 after account_users table exists

-- Create updated_at trigger
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.accounts IS 'Billing and subscription entities that users belong to. Each user has a personal account (seat_count=1) and can belong to team accounts (seat_count>=2).';
