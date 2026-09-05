-- Migration: Add email_sent_at and email_sent_to tracking columns to campaign_subscriptions table
ALTER TABLE public.campaign_subscriptions
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_sent_to TEXT;

-- Create index for filtering subscriptions by email sent status
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_email_sent ON public.campaign_subscriptions(campaign_id, email_sent_at);
