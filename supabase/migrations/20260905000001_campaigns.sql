-- Enable required extensions & helper for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE OR REPLACE FUNCTION public.uuid_generate_v4() RETURNS uuid AS $$ SELECT gen_random_uuid(); $$ LANGUAGE sql;

-- 1. Campaign status enum
DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Global coupon number sequence (starts at 1001 for professional-looking codes)
CREATE SEQUENCE IF NOT EXISTS coupon_number_seq START WITH 1001;

-- 3. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    discount_percentage INTEGER NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100),
    description TEXT,
    status campaign_status NOT NULL DEFAULT 'draft',
    card_template_config JSONB NOT NULL DEFAULT '{
        "bg_gradient_from": "#4f46e5",
        "bg_gradient_to": "#7c3aed",
        "text_color": "#ffffff",
        "accent_color": "#fbbf24",
        "layout": "default"
    }'::jsonb,
    card_background_url TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- 4. CAMPAIGN SUBSCRIPTIONS TABLE (family enrollment in campaigns)
CREATE TABLE IF NOT EXISTS public.campaign_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    coupon_number BIGINT NOT NULL DEFAULT nextval('coupon_number_seq'),
    coupon_code TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscribed_by UUID REFERENCES public.profiles(id),
    UNIQUE (campaign_id, registration_id)
);

-- 5. Trigger function: auto-generate coupon_code from coupon_number on INSERT
CREATE OR REPLACE FUNCTION public.generate_coupon_code()
RETURNS TRIGGER AS $$
BEGIN
    -- coupon_number is already set via DEFAULT nextval('coupon_number_seq')
    NEW.coupon_code := 'ASFANU' || NEW.coupon_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_coupon_code ON public.campaign_subscriptions;
CREATE TRIGGER set_coupon_code
    BEFORE INSERT ON public.campaign_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.generate_coupon_code();

-- 6. RLS POLICIES (following existing project pattern from 20260730000002)

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_subscriptions ENABLE ROW LEVEL SECURITY;

-- Campaigns: viewable by all authenticated users
DROP POLICY IF EXISTS "Campaigns viewable by authenticated users" ON public.campaigns;
CREATE POLICY "Campaigns viewable by authenticated users"
    ON public.campaigns FOR SELECT TO authenticated USING (true);

-- Campaigns: creatable by admins and operators
DROP POLICY IF EXISTS "Campaigns creatable by admins and operators" ON public.campaigns;
CREATE POLICY "Campaigns creatable by admins and operators"
    ON public.campaigns FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('admin', 'operator'));

-- Campaigns: updatable by admins and operators
DROP POLICY IF EXISTS "Campaigns updatable by admins and operators" ON public.campaigns;
CREATE POLICY "Campaigns updatable by admins and operators"
    ON public.campaigns FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'operator'));

-- Campaigns: deletable by admins only
DROP POLICY IF EXISTS "Campaigns deletable by admins only" ON public.campaigns;
CREATE POLICY "Campaigns deletable by admins only"
    ON public.campaigns FOR DELETE TO authenticated
    USING (public.get_current_user_role() = 'admin');

-- Campaign subscriptions: viewable by all authenticated users
DROP POLICY IF EXISTS "Campaign subscriptions viewable by authenticated users" ON public.campaign_subscriptions;
CREATE POLICY "Campaign subscriptions viewable by authenticated users"
    ON public.campaign_subscriptions FOR SELECT TO authenticated USING (true);

-- Campaign subscriptions: creatable by admins and operators
DROP POLICY IF EXISTS "Campaign subscriptions creatable by admins and operators" ON public.campaign_subscriptions;
CREATE POLICY "Campaign subscriptions creatable by admins and operators"
    ON public.campaign_subscriptions FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('admin', 'operator'));

-- Campaign subscriptions: deletable by admins only
DROP POLICY IF EXISTS "Campaign subscriptions deletable by admins only" ON public.campaign_subscriptions;
CREATE POLICY "Campaign subscriptions deletable by admins only"
    ON public.campaign_subscriptions FOR DELETE TO authenticated
    USING (public.get_current_user_role() = 'admin');

-- 7. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_campaign_id
    ON public.campaign_subscriptions(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_registration_id
    ON public.campaign_subscriptions(registration_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_status
    ON public.campaigns(status);

CREATE INDEX IF NOT EXISTS idx_campaigns_slug
    ON public.campaigns(slug);

-- 8. GRANTS & SCHEMA RELOAD FOR POSTGREST
GRANT ALL ON TABLE public.campaigns TO authenticated;
GRANT ALL ON TABLE public.campaigns TO service_role;
GRANT ALL ON TABLE public.campaign_subscriptions TO authenticated;
GRANT ALL ON TABLE public.campaign_subscriptions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.coupon_number_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.coupon_number_seq TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_coupon_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_coupon_code() TO service_role;

NOTIFY pgrst, 'reload schema';
