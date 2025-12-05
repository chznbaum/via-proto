-- Enable realtime on accounts table for upgrade detection
-- This allows clients to subscribe to subscription_tier changes after Stripe webhook processes

alter publication supabase_realtime add table accounts;

-- Enable full replica identity so UPDATE events include all columns
alter table accounts replica identity full;
