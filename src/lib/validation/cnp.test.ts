import { describe, it, expect } from 'vitest';
import { validateCNP } from './cnp';

describe('validateCNP', () => {
  it('should validate valid Romanian CNPs correctly', () => {
    expect(validateCNP('5010101410018').isValid).toBe(true);
    expect(validateCNP('1990101400016').isValid).toBe(true);
    expect(validateCNP('2950512240018').isValid).toBe(true);
  });

  it('should reject invalid length or non-digit CNPs', () => {
    expect(validateCNP('12345').isValid).toBe(false);
    expect(validateCNP('123456789012345').isValid).toBe(false);
    expect(validateCNP('abc1234567890').isValid).toBe(false);
    expect(validateCNP(null).isValid).toBe(false);
  });

  it('should reject CNPs with invalid control digit', () => {
    expect(validateCNP('5010101410010').isValid).toBe(false);
  });
});
