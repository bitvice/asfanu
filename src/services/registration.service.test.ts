import { describe, it, expect } from 'vitest';
import { maskCNP, canAccessUnmaskedCNP } from '@/lib/security/cnp-masker';

describe('Phase 2 Database & Security Services', () => {
  it('should enforce CNP access control policies correctly by role', () => {
    expect(canAccessUnmaskedCNP('admin')).toBe(true);
    expect(canAccessUnmaskedCNP('operator')).toBe(false);
    expect(canAccessUnmaskedCNP('viewer')).toBe(false);
  });

  it('should format masked CNP for non-admin output', () => {
    expect(maskCNP('5010101410018')).toBe('501******0018');
    expect(maskCNP('1990101400016')).toBe('199******0016');
  });
});
