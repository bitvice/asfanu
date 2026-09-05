import { describe, it, expect } from 'vitest';
import { formatVoucherName, toPascalCaseName } from '../utils';

describe('formatVoucherName utility', () => {
  it('formats last name UPPERCASE and first name PascalCase', () => {
    const formatted = formatVoucherName('balasz bunel', 'gabriel');
    expect(formatted).toBe('BALASZ BUNEL Gabriel');
  });

  it('handles hyphenated first names correctly', () => {
    const formatted = formatVoucherName('popescu', 'ion-alexandru');
    expect(formatted).toBe('POPESCU Ion-Alexandru');
  });

  it('handles missing first name gracefully', () => {
    const formatted = formatVoucherName('Ionescu');
    expect(formatted).toBe('IONESCU');
  });

  it('formats toPascalCaseName properly', () => {
    expect(toPascalCaseName('GABRIEL')).toBe('Gabriel');
    expect(toPascalCaseName('maria anca')).toBe('Maria Anca');
  });
});
