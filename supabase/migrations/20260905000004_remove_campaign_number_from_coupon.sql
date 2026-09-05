-- Migration: Remove campaign_number from coupon_code format
-- Format: {slug(3)}{YYMMDD(6)}{nr_familie(3+)}{hash(2)}

-- 1. CHECKSUM FUNCTION (PL/pgSQL)
CREATE OR REPLACE FUNCTION public.calculate_coupon_checksum(
    p_slug TEXT,
    p_date TEXT,
    p_fam_num BIGINT
) RETURNS TEXT AS $$
DECLARE
    v_input TEXT;
    v_int INT;
    v_charset TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    v_char1 CHAR;
    v_char2 CHAR;
BEGIN
    v_input := upper(p_slug) || p_date || lpad(p_fam_num::text, 3, '0') || 'ASFANU_SECRET_2026';
    v_int := abs(hashtext(v_input));
    v_char1 := substr(v_charset, (v_int / 36) % 36 + 1, 1);
    v_char2 := substr(v_charset, v_int % 36 + 1, 1);
    RETURN v_char1 || v_char2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. TRIGGER FUNCTION FOR UNHYPHENATED COUPON CODES (14-char format)
CREATE OR REPLACE FUNCTION public.generate_coupon_code()
RETURNS TRIGGER AS $$
DECLARE
    v_slug TEXT;
    v_fam_num BIGINT;
    v_date_str TEXT;
    v_hash TEXT;
BEGIN
    -- If valid custom coupon_code is provided from app and length >= 14, preserve it
    IF NEW.coupon_code IS NOT NULL AND NEW.coupon_code != 'PENDING' AND NEW.coupon_code NOT LIKE 'ASFANU%' AND length(NEW.coupon_code) >= 14 THEN
        RETURN NEW;
    END IF;

    -- Fetch campaign details
    SELECT upper(coalesce(code_slug, 'ASF'))
    INTO v_slug
    FROM public.campaigns
    WHERE id = NEW.campaign_id;

    -- Fetch registration family_number
    SELECT family_number
    INTO v_fam_num
    FROM public.registrations
    WHERE id = NEW.registration_id;

    -- Set defaults if missing
    v_slug := coalesce(v_slug, 'ASF');
    v_fam_num := coalesce(v_fam_num, 1);
    v_date_str := to_char(coalesce(NEW.subscribed_at, NOW()), 'YYMMDD');

    -- Compute 2-character checksum
    v_hash := public.calculate_coupon_checksum(v_slug, v_date_str, v_fam_num);

    -- Assemble unhyphenated code (slug 3 + date 6 + fam_num 3+ + hash 2)
    NEW.coupon_code := rpad(v_slug, 3, 'X') || 
                       v_date_str || 
                       lpad(v_fam_num::text, 3, '0') || 
                       v_hash;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger
DROP TRIGGER IF EXISTS set_coupon_code ON public.campaign_subscriptions;
CREATE TRIGGER set_coupon_code
    BEFORE INSERT ON public.campaign_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.generate_coupon_code();

-- 3. RE-CALCULATE AND UPDATE ALL EXISTING SUBSCRIPTIONS TO NEW FORMAT
DO $$
DECLARE
    r RECORD;
    v_slug TEXT;
    v_fam_num BIGINT;
    v_date_str TEXT;
    v_hash TEXT;
    v_new_code TEXT;
BEGIN
    FOR r IN SELECT * FROM public.campaign_subscriptions LOOP
        SELECT upper(coalesce(code_slug, 'ASF'))
        INTO v_slug
        FROM public.campaigns WHERE id = r.campaign_id;

        SELECT family_number INTO v_fam_num
        FROM public.registrations WHERE id = r.registration_id;

        v_slug := coalesce(v_slug, 'ASF');
        v_fam_num := coalesce(v_fam_num, 1);
        v_date_str := to_char(coalesce(r.subscribed_at, NOW()), 'YYMMDD');

        v_hash := public.calculate_coupon_checksum(v_slug, v_date_str, v_fam_num);

        v_new_code := rpad(v_slug, 3, 'X') || v_date_str || lpad(v_fam_num::text, 3, '0') || v_hash;

        UPDATE public.campaign_subscriptions
        SET coupon_code = v_new_code
        WHERE id = r.id;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
