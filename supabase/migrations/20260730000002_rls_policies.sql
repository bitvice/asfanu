-- Row Level Security (RLS) Policy Migration for ASFANU

-- Helper function to fetch current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles editable by admins" ON public.profiles;
CREATE POLICY "Profiles editable by admins"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- 2. REGISTRATIONS POLICIES
DROP POLICY IF EXISTS "Registrations viewable by authenticated users" ON public.registrations;
CREATE POLICY "Registrations viewable by authenticated users"
  ON public.registrations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Registrations creatable by admins and operators" ON public.registrations;
CREATE POLICY "Registrations creatable by admins and operators"
  ON public.registrations FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('admin', 'operator'));

DROP POLICY IF EXISTS "Registrations updatable by admins and operators" ON public.registrations;
CREATE POLICY "Registrations updatable by admins and operators"
  ON public.registrations FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'operator'));

DROP POLICY IF EXISTS "Registrations deletable by admins only" ON public.registrations;
CREATE POLICY "Registrations deletable by admins only"
  ON public.registrations FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- 3. CHILDREN POLICIES
DROP POLICY IF EXISTS "Children viewable by authenticated users" ON public.children;
CREATE POLICY "Children viewable by authenticated users"
  ON public.children FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Children insertable by admins and operators" ON public.children;
CREATE POLICY "Children insertable by admins and operators"
  ON public.children FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('admin', 'operator'));

DROP POLICY IF EXISTS "Children updatable by admins and operators" ON public.children;
CREATE POLICY "Children updatable by admins and operators"
  ON public.children FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'operator'));

DROP POLICY IF EXISTS "Children deletable by admins only" ON public.children;
CREATE POLICY "Children deletable by admins only"
  ON public.children FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- 4. IMPORTS & IMPORT_ROWS POLICIES
DROP POLICY IF EXISTS "Imports viewable by authenticated users" ON public.imports;
CREATE POLICY "Imports viewable by authenticated users"
  ON public.imports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Imports creatable by admins and operators" ON public.imports;
CREATE POLICY "Imports creatable by admins and operators"
  ON public.imports FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('admin', 'operator'));

DROP POLICY IF EXISTS "Import rows viewable by authenticated users" ON public.import_rows;
CREATE POLICY "Import rows viewable by authenticated users"
  ON public.import_rows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Import rows insertable by admins and operators" ON public.import_rows;
CREATE POLICY "Import rows insertable by admins and operators"
  ON public.import_rows FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('admin', 'operator'));

-- 5. AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Audit logs viewable by admins only" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by admins only"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Audit logs insertable by authenticated users" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by authenticated users"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
