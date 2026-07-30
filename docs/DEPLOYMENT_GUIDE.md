# ASFANU Internal Database Application - Deployment Guide

## 1. System Requirements & Environment
- **Node.js**: v18.x or v20.x+
- **Database**: Supabase PostgreSQL (Managed Cloud instance)
- **Deployment Platform**: Vercel / Cloudflare Pages / Node.js Server

---

## 2. Environment Variables Configuration

Set the following environment variables in your deployment dashboard (e.g. Vercel Project Settings):

```bash
# Supabase Public Credentials (Safe for Client & SSR)
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-supabase-anon-key>"

# Optional: Supabase Service Role Key (Used ONLY for automated migrations / server scripts)
SUPABASE_SERVICE_ROLE_KEY="<your-supabase-service-role-key>"
```

> [!CAUTION]
> **CRITICAL SECURITY REQUIREMENT**
> Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code or prefix it with `NEXT_PUBLIC_`.

---

## 3. Database Migration Execution

Apply the SQL migration scripts located in `supabase/migrations/` using the Supabase CLI or Supabase SQL Editor:

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual Execution via SQL Editor (in sequential order):
# 1. 20260730000001_initial_schema.sql  (Tables, Enums & Triggers)
# 2. 20260730000002_rls_policies.sql    (Row Level Security Policies)
# 3. 20260730000003_indexes.sql         (Trigram pg_trgm & B-Tree Indexes)
```

---

## 4. Production Build & Deployment Command

```bash
# Install production dependencies
npm install

# Run automated unit test suite
npm run test

# Compile production bundle
npm run build

# Start production server (Port 4081 or 8080)
npm run start
```

---

## 5. Verification Checklist Post-Deployment

1. Access `https://your-domain.com/login` and verify Supabase Auth redirects.
2. Login with an `operator` or `admin` account and verify `/dashboard` metric widgets load.
3. Test uploading `/docs/Lista familii inscrise Brasov 05,03,2026.xlsx` in `/imports/new`.
4. Verify CNP values are masked (`199******1234`) for non-admin accounts.
5. Check `/settings` audit log table to confirm sensitive event logging.
