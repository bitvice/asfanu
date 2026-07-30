import { UserRole } from '@/lib/security/cnp-masker';

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin';
}

export function canImportExcel(role: UserRole): boolean {
  return role === 'admin' || role === 'operator';
}

export function canEditRegistrations(role: UserRole): boolean {
  return role === 'admin' || role === 'operator';
}

export function canDeleteRegistrations(role: UserRole): boolean {
  return role === 'admin';
}

export function canExportData(role: UserRole): boolean {
  return role === 'admin' || role === 'operator';
}

export function canViewAuditLogs(role: UserRole): boolean {
  return role === 'admin';
}
