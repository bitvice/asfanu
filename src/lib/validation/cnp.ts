/**
 * Validates a Romanian Personal Numeric Code (CNP).
 * Standard: 13 digits (SAALLLZZJJNNN)
 * Multipliers: 2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9
 */
export function validateCNP(cnp: string | null | undefined): { isValid: boolean; error?: string } {
  if (!cnp) {
    return { isValid: false, error: 'CNP-ul este obligatoriu.' };
  }

  const clean = cnp.trim();

  if (!/^\d{13}$/.test(clean)) {
    return { isValid: false, error: 'CNP-ul trebuie să conțină exact 13 cifre.' };
  }

  const s = parseInt(clean[0], 10);
  if (s === 0) {
    return { isValid: false, error: 'Prima cifră a CNP-ului (Sex) nu poate fi 0.' };
  }

  const month = parseInt(clean.slice(3, 5), 10);
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Luna din CNP este invalidă.' };
  }

  const day = parseInt(clean.slice(5, 7), 10);
  if (day < 1 || day > 31) {
    return { isValid: false, error: 'Ziua din CNP este invalidă.' };
  }

  const county = parseInt(clean.slice(7, 9), 10);
  const validCounties = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
    39, 40, 41, 42, 43, 44, 45, 46, 51, 52
  ];
  if (!validCounties.includes(county)) {
    return { isValid: false, error: 'Codul de județ din CNP este invalid.' };
  }

  // Control digit verification
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }

  const remainder = sum % 11;
  const expectedControl = remainder === 10 ? 1 : remainder;
  const actualControl = parseInt(clean[12], 10);

  if (expectedControl !== actualControl) {
    return { isValid: false, error: 'Cifra de control a CNP-ului este invalidă.' };
  }

  return { isValid: true };
}
