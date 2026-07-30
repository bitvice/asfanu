/**
 * Masks a 13-digit Romanian CNP for non-admin display.
 * Example: "1990101123456" -> "199******3456"
 */
export function maskCNP(cnp: string | null | undefined): string {
  if (!cnp) return 'N/A';
  const clean = cnp.trim();
  if (clean.length !== 13) {
    return '*** INVALIDE ***';
  }
  // Keep first 3 digits (Sex + Century + Year digit 1) and last 4 digits (Sequential + Control)
  return `${clean.slice(0, 3)}******${clean.slice(9)}`;
}

export type UserRole = 'admin' | 'operator' | 'viewer';

export function canAccessUnmaskedCNP(userRole: UserRole): boolean {
  return userRole === 'admin';
}
