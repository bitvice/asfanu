import { describe, it, expect } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('should normalize standard Romanian 10-digit mobile numbers', () => {
    const res = normalizePhone('0721 234 567');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('+40721234567');
  });

  it('should normalize international format numbers', () => {
    const res = normalizePhone('+40 721-234-567');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('+40721234567');
  });

  it('should normalize 0040 format numbers', () => {
    const res = normalizePhone('0040721234567');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('+40721234567');
  });

  it('should reject invalid or incomplete phone numbers', () => {
    expect(normalizePhone('12345').isValid).toBe(false);
    expect(normalizePhone(null).isValid).toBe(false);
  });
});
