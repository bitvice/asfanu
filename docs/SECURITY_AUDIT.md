# Security Architecture & Data Compliance Audit

## 1. Executive Summary
This application stores sensitive Personal Identifiable Information (PII) including minor data and Romanian Personal Numeric Codes (CNP). The security posture implements defense-in-depth across database, server actions, and frontend views.

---

## 2. Row Level Security (RLS) Matrix Audit

All PostgreSQL tables explicitly enforce Row-Level Security (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`).

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `public.profiles` | Authenticated | System Auth Trigger | Admin Only | Admin Only |
| `public.registrations` | Authenticated | Admin & Operator | Admin & Operator | Admin Only |
| `public.children` | Authenticated | Admin & Operator | Admin & Operator | Admin Only |
| `public.imports` | Authenticated | Admin & Operator | Admin & Operator | Admin Only |
| `public.import_rows` | Authenticated | Admin & Operator | Admin & Operator | Admin Only |
| `public.audit_logs` | Admin Only | Authenticated | Restricted | Restricted |

---

## 3. CNP Masking & Access Control Rules

1. **Default View Masking**:
   - `maskCNP("5010101410018")` -> `"501******0018"`.
   - Executed on the application server prior to rendering data in RSC or sending client JSON payloads.
2. **Unmasking Authorization**:
   - Only users with `role = 'admin'` can request unmasked CNP values.
   - Any unmask action invokes `logAuditEvent({ action: 'READ_CNP', ... })` writing directly to `public.audit_logs`.
3. **No Log Exposure**:
   - CNP values are excluded from browser console logs, server console prints, and URL query strings.

---

## 4. Disaster Recovery & Database Backup Policy

- **Automated Backups**: Supabase Point-in-Time Recovery (PITR) enabled with daily full database snapshots.
- **Data Retention**: Audit logs retained indefinitely for compliance review.
- **Rollback Protocol**: Database schema migrations are version-controlled in `supabase/migrations/` and can be reverted using `supabase db reset`.
