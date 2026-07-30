-- PostgreSQL Indexing Strategy Migration for ASFANU

-- Trigram gin indexes for fast fuzzy search across names, emails, and locations
CREATE INDEX IF NOT EXISTS idx_registrations_parent_names ON public.registrations USING gin ((parent_last_name || ' ' || parent_first_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_registrations_primary_email_trgm ON public.registrations USING gin (primary_email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_children_names ON public.children USING gin ((last_name || ' ' || first_name) gin_trgm_ops);

-- B-Tree indexes for fast exact lookups, filters, and range queries
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations (phone);
CREATE INDEX IF NOT EXISTS idx_registrations_county_city ON public.registrations (county, city);
CREATE INDEX IF NOT EXISTS idx_registrations_registered_at ON public.registrations (registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_privacy ON public.registrations (privacy_policy_accepted);

CREATE INDEX IF NOT EXISTS idx_children_registration_id ON public.children (registration_id);
CREATE INDEX IF NOT EXISTS idx_children_cnp ON public.children (cnp);

CREATE INDEX IF NOT EXISTS idx_import_rows_import_status ON public.import_rows (import_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs (user_id, action, created_at DESC);
