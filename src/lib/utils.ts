import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a name part to Pascal Case (Title Case), handling hyphenated names and multiple spaces.
 * e.g. "gabriel-florin" -> "Gabriel-Florin", "GABRIEL ION" -> "Gabriel Ion"
 */
export function toPascalCaseName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .split(/([\s-]+)/)
    .map((part) => {
      if (part === ' ' || part === '-') return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/**
 * Formats family name for voucher compilation:
 * {NUME} {Prenume} -> Last name UPPERCASE, First name PascalCase
 * e.g. ("BALASZ Bunel", "Gabriel") -> "BALASZ BUNEL Gabriel"
 * e.g. ("popescu", "ion-alexandru") -> "POPESCU Ion-Alexandru"
 */
export function formatVoucherName(lastName: string, firstName?: string): string {
  const formattedLast = (lastName || '').trim().toUpperCase();
  const formattedFirst = firstName ? toPascalCaseName(firstName) : '';
  return formattedFirst ? `${formattedLast} ${formattedFirst}` : formattedLast;
}
