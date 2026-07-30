import { describe, it, expect } from 'vitest';
import {
  canManageUsers,
  canImportExcel,
  canEditRegistrations,
  canDeleteRegistrations,
  canExportData,
  canViewAuditLogs,
} from './permissions';

describe('Role Permission Helpers', () => {
  it('should grant full privileges to Admin', () => {
    expect(canManageUsers('admin')).toBe(true);
    expect(canImportExcel('admin')).toBe(true);
    expect(canEditRegistrations('admin')).toBe(true);
    expect(canDeleteRegistrations('admin')).toBe(true);
    expect(canExportData('admin')).toBe(true);
    expect(canViewAuditLogs('admin')).toBe(true);
  });

  it('should grant operational privileges to Operator', () => {
    expect(canManageUsers('operator')).toBe(false);
    expect(canImportExcel('operator')).toBe(true);
    expect(canEditRegistrations('operator')).toBe(true);
    expect(canDeleteRegistrations('operator')).toBe(false);
    expect(canExportData('operator')).toBe(true);
    expect(canViewAuditLogs('operator')).toBe(false);
  });

  it('should restrict Viewer to read-only access', () => {
    expect(canManageUsers('viewer')).toBe(false);
    expect(canImportExcel('viewer')).toBe(false);
    expect(canEditRegistrations('viewer')).toBe(false);
    expect(canDeleteRegistrations('viewer')).toBe(false);
    expect(canExportData('viewer')).toBe(false);
    expect(canViewAuditLogs('viewer')).toBe(false);
  });
});
