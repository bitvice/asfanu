import { describe, it, expect } from 'vitest';
import { generateAutoMapping } from './auto-mapper';
import { ParsedHeader } from './excel-parser';

describe('generateAutoMapping', () => {
  it('should auto-map Romanian Excel headers to correct database fields', () => {
    const headers: ParsedHeader[] = [
      { originalName: 'Marcaj de timp', uniqueKey: 'Marcaj de timp', columnIndex: 0, occurrenceIndex: 1 },
      { originalName: 'Nume de familie', uniqueKey: 'Nume de familie [1]', columnIndex: 1, occurrenceIndex: 1 },
      { originalName: 'Nume de familie', uniqueKey: 'Nume de familie [2]', columnIndex: 2, occurrenceIndex: 2 },
      { originalName: 'Prenume', uniqueKey: 'Prenume [1]', columnIndex: 3, occurrenceIndex: 1 },
      { originalName: 'Prenume', uniqueKey: 'Prenume [2]', columnIndex: 4, occurrenceIndex: 2 },
      { originalName: 'E-mail', uniqueKey: 'E-mail [1]', columnIndex: 5, occurrenceIndex: 1 },
      { originalName: 'CNP', uniqueKey: 'CNP', columnIndex: 6, occurrenceIndex: 1 },
    ];

    const mapping = generateAutoMapping(headers);

    expect(mapping['Marcaj de timp']).toBe('registered_at');
    expect(mapping['Nume de familie [1]']).toBe('parent_last_name');
    expect(mapping['Nume de familie [2]']).toBe('child_last_name');
    expect(mapping['Prenume [1]']).toBe('parent_first_name');
    expect(mapping['Prenume [2]']).toBe('child_first_name');
    expect(mapping['E-mail [1]']).toBe('primary_email');
    expect(mapping['CNP']).toBe('child_cnp');
  });
});
