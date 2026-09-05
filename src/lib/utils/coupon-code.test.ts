import { describe, it, expect } from 'vitest';
import { calculateCouponChecksum, parseCouponCode, generateCouponCode } from './coupon-code';

describe('coupon-code utility', () => {
  it('calculates consistent 2-character checksums', () => {
    const hash1 = calculateCouponChecksum('EDU', '260905', 42);
    const hash2 = calculateCouponChecksum('EDU', '260905', 42);
    expect(hash1).toHaveLength(2);
    expect(hash1).toBe(hash2);
  });

  it('parses valid unhyphenated coupon codes accurately', () => {
    const slug = 'EDU';
    const dateStr = '260905';
    const famNum = 42;
    const hash = calculateCouponChecksum(slug, dateStr, famNum);
    const fullCode = `EDU260905042${hash}`;

    const parsed = parseCouponCode(fullCode);
    expect(parsed.slug).toBe('EDU');
    expect(parsed.dateStr).toBe('260905');
    expect(parsed.formattedDate).toBe('2026-09-05');
    expect(parsed.familyNumber).toBe(42);
    expect(parsed.hash).toBe(hash);
    expect(parsed.isValid).toBe(true);
  });

  it('handles 4-digit family numbers seamlessly', () => {
    const slug = 'CHR';
    const dateStr = '261225';
    const famNum = 1042;
    const hash = calculateCouponChecksum(slug, dateStr, famNum);
    const fullCode = `CHR2612251042${hash}`;

    const parsed = parseCouponCode(fullCode);
    expect(parsed.slug).toBe('CHR');
    expect(parsed.familyNumber).toBe(1042);
    expect(parsed.isValid).toBe(true);
  });

  it('invalidates tampered codes', () => {
    const slug = 'EDU';
    const dateStr = '260905';
    const hash = calculateCouponChecksum(slug, dateStr, 42);
    // Tamper family number from 042 to 043 without updating hash
    const tamperedCode = `EDU260905043${hash}`;

    const parsed = parseCouponCode(tamperedCode);
    expect(parsed.isValid).toBe(false);
  });

  it('generates valid coupon codes matching the required format without campaign number', () => {
    const code = generateCouponCode({
      slug: 'IMP',
      date: new Date('2026-09-05'),
      familyNumber: 1,
    });

    expect(code.startsWith('IMP260905001')).toBe(true);
    expect(code.length).toBe(14);
    const parsed = parseCouponCode(code);
    expect(parsed.isValid).toBe(true);
    expect(parsed.slug).toBe('IMP');
    expect(parsed.familyNumber).toBe(1);
  });
});


