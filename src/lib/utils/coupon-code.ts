/**
 * Helper utility for generating, parsing, and validating unhyphenated coupon codes.
 * Format: {slug(3)}{YYMMDD(6)}{nr_familie(3+)}{hash(2)}
 * Example: EDU260905042A7
 */

const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Calculates 2-character checksum string matching PostgreSQL PL/pgSQL function.
 */
export function calculateCouponChecksum(
  slug: string,
  dateStr: string,
  famNum: number
): string {
  const cleanSlug = slug.toUpperCase().padEnd(3, 'X').slice(0, 3);
  const cleanFamNum = String(famNum).padStart(3, '0');
  
  const input = `${cleanSlug}${dateStr}${cleanFamNum}ASFANU_SECRET_2026`;

  let hashVal = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hashVal = (hashVal << 5) - hashVal + char;
    hashVal |= 0;
  }

  const absHash = Math.abs(hashVal);
  const char1 = CHARSET[Math.floor(absHash / 36) % 36];
  const char2 = CHARSET[absHash % 36];
  return `${char1}${char2}`;
}

export interface ParsedCouponCode {
  raw: string;
  slug: string;
  dateStr: string;
  formattedDate: string | null;
  familyNumber: number;
  hash: string;
  isValid: boolean;
}

/**
 * Parses an unhyphenated coupon code into its constituent parts and validates checksum if possible.
 */
export function parseCouponCode(code: string): ParsedCouponCode {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Minimum length: 3 (slug) + 6 (date) + 3 (fam) + 2 (hash) = 14
  if (clean.length < 14) {
    return {
      raw: code,
      slug: '',
      dateStr: '',
      formattedDate: null,
      familyNumber: 0,
      hash: '',
      isValid: false,
    };
  }

  const slug = clean.slice(0, 3);
  const dateStr = clean.slice(3, 9); // YYMMDD
  const famNumStr = clean.slice(9, clean.length - 2);
  const hash = clean.slice(clean.length - 2);

  const familyNumber = parseInt(famNumStr, 10);

  let formattedDate: string | null = null;
  if (/^\d{6}$/.test(dateStr)) {
    const yy = dateStr.slice(0, 2);
    const mm = dateStr.slice(2, 4);
    const dd = dateStr.slice(4, 6);
    formattedDate = `20${yy}-${mm}-${dd}`;
  }

  const expectedChecksum = calculateCouponChecksum(slug, dateStr, familyNumber);
  const isValid = !isNaN(familyNumber) && hash === expectedChecksum;

  return {
    raw: code,
    slug,
    dateStr,
    formattedDate,
    familyNumber,
    hash,
    isValid,
  };
}

/**
 * Generates an unhyphenated coupon code following:
 * {slug(3)}{YYMMDD(6)}{nr_familie(3+)}{hash(2)}
 */
export function generateCouponCode({
  slug = 'ASF',
  date = new Date(),
  familyNumber = 1,
}: {
  slug?: string | null;
  date?: Date | string | null;
  familyNumber?: number | null;
} = {}): string {
  const cleanSlug = (slug || 'ASF').toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(3, 'X').slice(0, 3);

  let dateObj: Date;
  if (!date) {
    dateObj = new Date();
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
  } else {
    dateObj = date;
  }

  const yy = String(dateObj.getFullYear()).slice(-2);
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  const famNum = Math.max(1, familyNumber || 1);

  const checksum = calculateCouponChecksum(cleanSlug, dateStr, famNum);
  const cleanFamNum = String(famNum).padStart(3, '0');

  return `${cleanSlug}${dateStr}${cleanFamNum}${checksum}`;
}

