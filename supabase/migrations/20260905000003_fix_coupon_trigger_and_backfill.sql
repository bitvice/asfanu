-- 1. CHECKSUM FUNCTION (PL/pgSQL)
CREATE OR REPLACE FUNCTION public.calculate_coupon_checksum(
    p_slug TEXT,
    p_date TEXT,
    p_camp_num BIGINT,
    p_fam_num BIGINT
) RETURNS TEXT AS $$
DECLARE
    v_input TEXT;
    v_int INT;
    v_charset TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    v_char1 CHAR;
    v_char2 CHAR;
BEGIN
    v_input := upper(p_slug) || p_date || lpad(p_camp_num::text, 3, '0') || lpad(p_fam_num::text, 3, '0') || 'ASFANU_SECRET_2026';
    v_int := abs(hashtext(v_input));
    v_char1 := substr(v_charset, (v_int / 36) % 36 + 1, 1);
    v_char2 := substr(v_charset, v_int % 36 + 1, 1);
    RETURN v_char1 || v_char2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. TRIGGER FUNCTION FOR UNHYPHENATED COUPON CODES
CREATE OR REPLACE FUNCTION public.generate_coupon_code()
RETURNS TRIGGER AS $$
DECLARE
    v_slug TEXT;
    v_camp_num INT;
    v_fam_num BIGINT;
    v_date_str TEXT;
    v_hash TEXT;
BEGIN
    -- If valid custom coupon_code is provided from app and not default PENDING/ASFANU, preserve it
    IF NEW.coupon_code IS NOT NULL AND NEW.coupon_code != 'PENDING' AND NEW.coupon_code NOT LIKE 'ASFANU%' AND length(NEW.coupon_code) >= 17 THEN
        RETURN NEW;
    END IF;

    -- Fetch campaign details
    SELECT upper(coalesce(code_slug, 'ASF')), campaign_number
    INTO v_slug, v_camp_num
    FROM public.campaigns
    WHERE id = NEW.campaign_id;

    -- Fetch registration family_number
    SELECT family_number
    INTO v_fam_num
    FROM public.registrations
    WHERE id = NEW.registration_id;

    -- Set defaults if missing
    v_slug := coalesce(v_slug, 'ASF');
    v_camp_num := coalesce(v_camp_num, 1);
    v_fam_num := coalesce(v_fam_num, 1);
    v_date_str := to_char(coalesce(NEW.subscribed_at, NOW()), 'YYMMDD');

    -- Compute 2-character checksum
    v_hash := public.calculate_coupon_checksum(v_slug, v_date_str, v_camp_num, v_fam_num);

    -- Assemble unhyphenated code
    NEW.coupon_code := rpad(v_slug, 3, 'X') || 
                       v_date_str || 
                       lpad(v_camp_num::text, 3, '0') || 
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

-- 3. RLS UPDATE POLICY for campaign_subscriptions
DROP POLICY IF EXISTS "Campaign subscriptions updatable by admins and operators" ON public.campaign_subscriptions;
CREATE POLICY "Campaign subscriptions updatable by admins and operators"
    ON public.campaign_subscriptions FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'operator'));

-- 4. BACKFILL existing legacy 'ASFANU...' coupon_codes in campaign_subscriptions
DO $$
DECLARE
    r RECORD;
    v_slug TEXT;
    v_camp_num INT;
    v_fam_num BIGINT;
    v_date_str TEXT;
    v_hash TEXT;
    v_new_code TEXT;
BEGIN
    FOR r IN SELECT * FROM public.campaign_subscriptions WHERE coupon_code LIKE 'ASFANU%' OR coupon_code = 'PENDING' LOOP
        SELECT upper(coalesce(code_slug, 'ASF')), campaign_number
        INTO v_slug, v_camp_num
        FROM public.campaigns WHERE id = r.campaign_id;

        SELECT family_number INTO v_fam_num
        FROM public.registrations WHERE id = r.registration_id;

        v_slug := coalesce(v_slug, 'ASF');
        v_camp_num := coalesce(v_camp_num, 1);
        v_fam_num := coalesce(v_fam_num, 1);
        v_date_str := to_char(coalesce(r.subscribed_at, NOW()), 'YYMMDD');

        v_hash := public.calculate_coupon_checksum(v_slug, v_date_str, v_camp_num, v_fam_num);

        v_new_code := rpad(v_slug, 3, 'X') || v_date_str || lpad(v_camp_num::text, 3, '0') || lpad(v_fam_num::text, 3, '0') || v_hash;

        UPDATE public.campaign_subscriptions
        SET coupon_code = v_new_code
        WHERE id = r.id;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
