import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { parseExcelFile } from './excel-parser';

describe('parseExcelFile', () => {
  it('should parse Excel headers and disambiguate duplicate column names with indices', () => {
    const dataMatrix = [
      ['Nume de familie', 'Nume de familie', 'Prenume', 'Prenume', 'CNP'],
      ['Popescu', 'Popescu Jr', 'Ion', 'Andrei', '5010101410018'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dataMatrix);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const result = parseExcelFile(buffer);

    expect(result.headers.length).toBe(5);
    expect(result.headers[0].uniqueKey).toBe('Nume de familie [1]');
    expect(result.headers[1].uniqueKey).toBe('Nume de familie [2]');
    expect(result.headers[2].uniqueKey).toBe('Prenume [1]');
    expect(result.headers[3].uniqueKey).toBe('Prenume [2]');
    expect(result.headers[4].uniqueKey).toBe('CNP');

    expect(result.rawRows.length).toBe(1);
    expect(result.rawRows[0]['Nume de familie [1]']).toBe('Popescu');
    expect(result.rawRows[0]['Nume de familie [2]']).toBe('Popescu Jr');
  });

  it('should successfully parse the actual sample Excel file from docs/', () => {
    const filePath = path.resolve(__dirname, '../../../docs/Lista familii inscrise Brasov 05,03,2026.xlsx');
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const result = parseExcelFile(buffer);

      expect(result.headers.length).toBeGreaterThan(0);
      expect(result.rawRows.length).toBeGreaterThan(0);

      // Verify presence of duplicate header disambiguation keys
      const uniqueKeys = result.headers.map(h => h.uniqueKey);
      expect(uniqueKeys.some(k => k.includes('[1]'))).toBe(true);
    }
  });
});
