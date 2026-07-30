import { normalizePhone } from '@/lib/validation/phone';

export type DuplicateConfidence = 'exact_duplicate' | 'probable_duplicate' | 'possible_duplicate' | null;

export interface ExistingRecordComparison {
  id: string;
  parent_first_name: string;
  parent_last_name: string;
  primary_email: string;
  phone: string;
  county: string;
  city: string;
  registered_at?: string;
  children?: Array<{ cnp: string }>;
}

export interface DuplicateCheckResult {
  confidence: DuplicateConfidence;
  matchRecordId?: string;
  reason?: string;
}

export function detectDuplicateRecord(
  incoming: {
    parent_first_name: string;
    parent_last_name: string;
    primary_email: string;
    phone: string;
    county: string;
    city: string;
    registered_at?: string;
    children?: Array<{ cnp: string }>;
  },
  existingRecords: ExistingRecordComparison[]
): DuplicateCheckResult {
  const incParentFirst = incoming.parent_first_name.toLowerCase().trim();
  const incParentLast = incoming.parent_last_name.toLowerCase().trim();
  const incEmail = incoming.primary_email.toLowerCase().trim();
  const incPhone = normalizePhone(incoming.phone).normalized || incoming.phone.replace(/\D/g, '');
  const incCity = incoming.city.toLowerCase().trim();
  const incCounty = incoming.county.toLowerCase().trim();
  const incCnps = (incoming.children || []).map(c => c.cnp.trim());

  for (const record of existingRecords) {
    const recParentFirst = record.parent_first_name.toLowerCase().trim();
    const recParentLast = record.parent_last_name.toLowerCase().trim();
    const recEmail = record.primary_email.toLowerCase().trim();
    const recPhone = normalizePhone(record.phone).normalized || record.phone.replace(/\D/g, '');
    const recCity = record.city.toLowerCase().trim();
    const recCounty = record.county.toLowerCase().trim();
    const recCnps = (record.children || []).map(c => c.cnp.trim());

    // 1. Exact duplicate checks
    const cnpMatch = incCnps.some(cnp => cnp && recCnps.includes(cnp));
    if (cnpMatch) {
      return {
        confidence: 'exact_duplicate',
        matchRecordId: record.id,
        reason: 'CNP-ul copilului există deja în baza de date.',
      };
    }

    if (incEmail && recEmail && incPhone && recPhone && incEmail === recEmail && incPhone === recPhone) {
      return {
        confidence: 'exact_duplicate',
        matchRecordId: record.id,
        reason: 'Email-ul principal și numărul de telefon coincid perfect.',
      };
    }

    // 2. Probable duplicate checks
    if (incParentLast === recParentLast && incParentFirst === recParentFirst && incCity === recCity) {
      return {
        confidence: 'probable_duplicate',
        matchRecordId: record.id,
        reason: 'Numele părintelui și orașul coincid.',
      };
    }

    // 3. Possible duplicate checks
    if (incPhone && recPhone && incPhone === recPhone) {
      return {
        confidence: 'possible_duplicate',
        matchRecordId: record.id,
        reason: 'Numărul de telefon coincide.',
      };
    }

    if (incParentLast === recParentLast && incCounty === recCounty) {
      return {
        confidence: 'possible_duplicate',
        matchRecordId: record.id,
        reason: 'Numele de familie al părintelui și județul coincid.',
      };
    }
  }

  return { confidence: null };
}
