import { describe, it, expect } from 'vitest';
import { detectDuplicateRecord } from './duplicate-detector';

describe('detectDuplicateRecord', () => {
  const existingRecords = [
    {
      id: 'rec-1',
      parent_first_name: 'Ion',
      parent_last_name: 'Popescu',
      primary_email: 'ion.popescu@gmail.com',
      phone: '+40721234567',
      county: 'Brașov',
      city: 'Brașov',
      children: [{ cnp: '5010101410018' }],
    },
  ];

  it('should detect exact duplicate by CNP match', () => {
    const res = detectDuplicateRecord(
      {
        parent_first_name: 'Alt',
        parent_last_name: 'Părinte',
        primary_email: 'alt@email.com',
        phone: '+40799999999',
        county: 'Cluj',
        city: 'Cluj-Napoca',
        children: [{ cnp: '5010101410018' }],
      },
      existingRecords
    );
    expect(res.confidence).toBe('exact_duplicate');
    expect(res.matchRecordId).toBe('rec-1');
  });

  it('should detect exact duplicate by email and phone match', () => {
    const res = detectDuplicateRecord(
      {
        parent_first_name: 'Ion',
        parent_last_name: 'Popescu',
        primary_email: 'ion.popescu@gmail.com',
        phone: '0721234567',
        county: 'Brașov',
        city: 'Brașov',
      },
      existingRecords
    );
    expect(res.confidence).toBe('exact_duplicate');
  });

  it('should detect probable duplicate by parent name and city', () => {
    const res = detectDuplicateRecord(
      {
        parent_first_name: 'Ion',
        parent_last_name: 'Popescu',
        primary_email: 'different@email.com',
        phone: '+40700000000',
        county: 'Brașov',
        city: 'Brașov',
      },
      existingRecords
    );
    expect(res.confidence).toBe('probable_duplicate');
  });
});
