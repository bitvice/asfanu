import { ParsedHeader } from './excel-parser';

export function generateAutoMapping(headers: ParsedHeader[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const fieldOccurrences: Record<string, number> = {};

  headers.forEach((header) => {
    const raw = header.originalName.trim().toLowerCase();
    fieldOccurrences[raw] = (fieldOccurrences[raw] || 0) + 1;
    const occ = fieldOccurrences[raw];

    if (raw.includes('marcaj') || raw.includes('timestamp')) {
      mapping[header.uniqueKey] = 'registered_at';
    } else if (raw.includes('nume de familie') || raw === 'nume') {
      mapping[header.uniqueKey] = occ === 1 ? 'parent_last_name' : 'child_last_name';
    } else if (raw.includes('prenume')) {
      mapping[header.uniqueKey] = occ === 1 ? 'parent_first_name' : 'child_first_name';
    } else if (raw.includes('e-mail') || raw.includes('email')) {
      if (raw.includes('primire')) {
        mapping[header.uniqueKey] = 'notification_email';
      } else if (occ === 1) {
        mapping[header.uniqueKey] = 'primary_email';
      } else if (occ === 2) {
        mapping[header.uniqueKey] = 'secondary_email';
      } else {
        mapping[header.uniqueKey] = 'child_email';
      }
    } else if (raw.includes('telefon')) {
      mapping[header.uniqueKey] = 'phone';
    } else if (raw.includes('adresa') || raw.includes('postala')) {
      mapping[header.uniqueKey] = 'postal_address';
    } else if (raw.includes('judet') || raw.includes('județ')) {
      mapping[header.uniqueKey] = 'county';
    } else if (raw.includes('oras') || raw.includes('oraș')) {
      mapping[header.uniqueKey] = 'city';
    } else if (raw.includes('politica') || raw.includes('confidentialitate')) {
      mapping[header.uniqueKey] = 'privacy_policy_accepted';
    } else if (raw.includes('cnp')) {
      mapping[header.uniqueKey] = 'child_cnp';
    } else if (raw.includes('numarul de copii') || raw.includes('copiilor')) {
      mapping[header.uniqueKey] = 'internal_notes';
    } else if (raw.includes('familiale') || raw.includes('familia')) {
      mapping[header.uniqueKey] = 'family_details';
    } else if (raw.includes('comentarii') || raw.includes('observatii')) {
      mapping[header.uniqueKey] = 'comments';
    } else {
      mapping[header.uniqueKey] = 'ignore';
    }
  });

  return mapping;
}
