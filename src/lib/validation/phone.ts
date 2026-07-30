/**
 * Normalizes and validates Romanian phone numbers.
 * Example outputs: "+40721234567"
 */
export function normalizePhone(rawPhone: string | null | undefined): {
  normalized: string;
  isValid: boolean;
  error?: string;
} {
  if (!rawPhone || !rawPhone.trim()) {
    return { normalized: '', isValid: true };
  }

  // Remove spaces, dashes, dots, parentheses
  let clean = rawPhone.trim().replace(/[\s\-\.\(\)]/g, '');

  if (clean.startsWith('0040')) {
    clean = '+' + clean.slice(2);
  } else if (clean.startsWith('40') && clean.length === 11) {
    clean = '+' + clean;
  } else if (clean.startsWith('07') && clean.length === 10) {
    clean = '+40' + clean.slice(1);
  }

  // Romanian mobile numbers format: +407XXXXXXXX (12 characters) or +402XXXXXXXX / +403XXXXXXXX
  const isRomanianFormat = /^\+40[237]\d{8}$/.test(clean);

  if (!isRomanianFormat) {
    return {
      normalized: clean,
      isValid: false,
      error: 'Numărul de telefon trebuie să fie un număr valid din România (ex: 0721234567 sau +40721234567).',
    };
  }

  return {
    normalized: clean,
    isValid: true,
  };
}
