import { describe, expect, it } from 'vitest';
import { calculateCurrentAge, parseBirthDate } from './age';

describe('child age helpers', () => {
  it('calculates age before and after the birthday in the current year', () => {
    expect(calculateCurrentAge('2015-08-15', new Date('2026-07-30T12:00:00Z'))).toBe(10);
    expect(calculateCurrentAge('2015-07-15', new Date('2026-07-30T12:00:00Z'))).toBe(11);
  });

  it('handles leap-day birthdays consistently', () => {
    expect(calculateCurrentAge('2012-02-29', new Date('2026-02-28T12:00:00Z'))).toBe(13);
    expect(calculateCurrentAge('2012-02-29', new Date('2026-03-01T12:00:00Z'))).toBe(14);
  });

  it('rejects invalid and future dates', () => {
    expect(parseBirthDate('2026-02-31')).toBeNull();
    expect(calculateCurrentAge('2030-01-01', new Date('2026-07-30T12:00:00Z'))).toBeNull();
    expect(calculateCurrentAge('')).toBeNull();
  });
});
