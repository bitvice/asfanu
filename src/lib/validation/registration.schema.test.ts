import { describe, expect, it } from 'vitest';
import { registrationSchema } from './registration.schema';

const validRegistration = {
  parent_first_name: 'Anca',
  parent_last_name: 'Paraschivescu',
  primary_email: 'anca@example.com',
  phone: '+40744979473',
  county: 'Brașov',
  city: 'Brașov',
  privacy_policy_accepted: true,
  children: [{
    first_name: 'Copil',
    last_name: 'Paraschivescu',
    cnp: '5010101410018',
    birth_date: '2001-01-01',
    age: 25,
  }],
};

describe('registrationSchema', () => {
  it('allows editing a registration after a child turns 18', () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('requires certificate number and issue date when the family has a certificate', () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      has_large_family_certificate: true,
      large_family_certificate_number: '',
      large_family_certificate_issued_at: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.large_family_certificate_number).toContain('Numărul certificatului este obligatoriu.');
      expect(result.error.flatten().fieldErrors.large_family_certificate_issued_at).toContain('Data emiterii certificatului este obligatorie.');
    }
  });

  it('accepts complete certificate details', () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      has_large_family_certificate: true,
      large_family_certificate_number: 'BV-12345',
      large_family_certificate_issued_at: '2026-01-15',
    });

    expect(result.success).toBe(true);
  });

  it('returns a Romanian message for an implausible age', () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      children: [{ ...validRegistration.children[0], age: 131 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Vârsta copilului nu poate depăși 130 de ani.');
    }
  });
});
