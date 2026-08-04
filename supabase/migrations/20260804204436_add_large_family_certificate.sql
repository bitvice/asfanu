alter table public.registrations
  add column if not exists has_large_family_certificate boolean not null default false,
  add column if not exists large_family_certificate_number text,
  add column if not exists large_family_certificate_issued_at date;

alter table public.registrations
  add constraint registrations_large_family_certificate_details_check
  check (
    not has_large_family_certificate
    or (
      nullif(btrim(large_family_certificate_number), '') is not null
      and large_family_certificate_issued_at is not null
    )
  );
