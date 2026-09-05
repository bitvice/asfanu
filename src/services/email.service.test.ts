import { describe, it, expect } from 'vitest';

describe('PDF Base64 processing for Email Attachment', () => {
  it('correctly extracts raw base64 data regardless of data URI prefix format', () => {
    const fakePdfBytes = Buffer.from('%PDF-1.4 Fake PDF Content');
    const validBase64 = fakePdfBytes.toString('base64');

    // Case 1: Standard jsPDF output with filename parameter
    const input1 = `data:application/pdf;filename=generated.pdf;base64,${validBase64}`;
    
    // Case 2: Standard Data URI prefix
    const input2 = `data:application/pdf;base64,${validBase64}`;

    // Case 3: Raw base64 string
    const input3 = validBase64;

    function extractBuffer(input: string): Buffer {
      const base64Content = input.includes(';base64,')
        ? input.split(';base64,').pop() || ''
        : input.replace(/^data:[^;]+;base64,/, '');
      const cleanBase64 = base64Content.replace(/\s+/g, '');
      return Buffer.from(cleanBase64, 'base64');
    }

    const buf1 = extractBuffer(input1);
    const buf2 = extractBuffer(input2);
    const buf3 = extractBuffer(input3);

    expect(buf1.toString('utf-8', 0, 4)).toBe('%PDF');
    expect(buf2.toString('utf-8', 0, 4)).toBe('%PDF');
    expect(buf3.toString('utf-8', 0, 4)).toBe('%PDF');
  });
});
