
export function normalizeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export function normalizeEmail(val: unknown): string {
  return normalizeString(val).toLowerCase();
}

export function normalizeBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  const str = normalizeString(val).toLowerCase();
  if (!str) return true; // Default to true for registered rows
  if (['nu', 'false', '0', 'no'].includes(str)) return false;
  return true;
}

export function parseRomanianDate(val: unknown): string | null {
  if (!val) return null;

  if (val instanceof Date) {
    return val.toISOString();
  }

  const str = normalizeString(val);
  if (!str) return null;

  // Check DD.MM.YYYY or DD/MM/YYYY
  const dotMatch = str.match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (dotMatch) {
    const day = parseInt(dotMatch[1], 10);
    const month = parseInt(dotMatch[2], 10) - 1;
    const year = parseInt(dotMatch[3], 10);
    const hours = dotMatch[4] ? parseInt(dotMatch[4], 10) : 0;
    const minutes = dotMatch[5] ? parseInt(dotMatch[5], 10) : 0;
    const date = new Date(Date.UTC(year, month, day, hours, minutes));
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // Fallback standard JS Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return null;
}

export function normalizeCityCounty(val: unknown): string {
  const str = normalizeString(val);
  if (!str) return '';
  // Title case Romanian city/county names
  return str
    .toLowerCase()
    .split(/([\s\-]+)/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
