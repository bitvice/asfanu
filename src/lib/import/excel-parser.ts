import * as XLSX from 'xlsx';

export interface ParsedHeader {
  originalName: string;
  uniqueKey: string; // e.g. "Nume de familie [1]", "Nume de familie [2]"
  columnIndex: number;
  occurrenceIndex: number;
}

export interface ParsedExcelResult {
  headers: ParsedHeader[];
  rawRows: Array<Record<string, unknown>>;
  totalRows: number;
}

export function parseExcelFile(buffer: Buffer): ParsedExcelResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Fișierul Excel este gol sau nu conține foi de calcul.');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (matrix.length === 0) {
    throw new Error('Foaia de calcul nu conține date.');
  }

  const rawHeaderRow = (matrix[0] || []).map((cell) => String(cell || '').trim());
  const headerOccurrences: Record<string, number> = {};

  const headers: ParsedHeader[] = rawHeaderRow.map((originalName, columnIndex) => {
    const name = originalName || `Coloana_${columnIndex + 1}`;
    headerOccurrences[name] = (headerOccurrences[name] || 0) + 1;
    const occurrenceIndex = headerOccurrences[name];

    const uniqueKey = headerOccurrences[name] > 1 || rawHeaderRow.filter(h => h === name).length > 1
      ? `${name} [${occurrenceIndex}]`
      : name;

    return {
      originalName: name,
      uniqueKey,
      columnIndex,
      occurrenceIndex,
    };
  });

  const rawRows: Array<Record<string, unknown>> = [];

  for (let rowIndex = 1; rowIndex < matrix.length; rowIndex++) {
    const rowValues = matrix[rowIndex];
    if (!rowValues || rowValues.every(val => val === '' || val === null || val === undefined)) {
      continue; // Skip empty rows
    }

    const rowObj: Record<string, unknown> = {
      _rowNumber: rowIndex + 1,
    };

    headers.forEach((header) => {
      rowObj[header.uniqueKey] = rowValues[header.columnIndex] ?? '';
    });

    rawRows.push(rowObj);
  }

  return {
    headers,
    rawRows,
    totalRows: rawRows.length,
  };
}
