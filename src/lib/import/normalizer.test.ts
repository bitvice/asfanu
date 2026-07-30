import { describe, it, expect } from 'vitest';
import {
  normalizeString,
  normalizeEmail,
  normalizeBoolean,
  parseRomanianDate,
  normalizeCityCounty,
} from './normalizer';

describe('normalizer helpers', () => {
  it('should normalize strings and emails', () => {
    expect(normalizeString('  Popescu  ')).toBe('Popescu');
    expect(normalizeEmail('  Ion.Popescu@GMAIL.com ')).toBe('ion.popescu@gmail.com');
  });

  it('should normalize boolean strings', () => {
    expect(normalizeBoolean('DA')).toBe(true);
    expect(normalizeBoolean('da')).toBe(true);
    expect(normalizeBoolean('1')).toBe(true);
    expect(normalizeBoolean('')).toBe(true);
    expect(normalizeBoolean('Nu')).toBe(false);
    expect(normalizeBoolean('nu')).toBe(false);
  });

  it('should parse Romanian date formats DD.MM.YYYY', () => {
    const isoDate = parseRomanianDate('05.03.2026 14:30');
    expect(isoDate).not.toBeNull();
    expect(isoDate?.startsWith('2026-03-05')).toBe(true);
  });

  it('should title-case city and county names', () => {
    expect(normalizeCityCounty('brașov')).toBe('Brașov');
    expect(normalizeCityCounty('CLUJ-NAPOCA')).toBe('Cluj-Napoca');
  });
});
