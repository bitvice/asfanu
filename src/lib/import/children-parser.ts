export interface ExtractedChild {
  first_name: string;
  last_name: string;
  cnp?: string;
  age?: number;
  birth_date?: string; // YYYY-MM-DD
  email?: string;
}

/**
 * Parses birth date and age from Romanian CNP (13 digits)
 */
export function parseCNPBirthData(cnp: string, currentYear = 2026): { birthDate?: string; age?: number; gender?: 'M' | 'F' } | null {
  if (!cnp || cnp.length !== 13 || !/^\d+$/.test(cnp)) return null;

  const s = parseInt(cnp[0], 10);
  const yy = parseInt(cnp.substring(1, 3), 10);
  const mm = parseInt(cnp.substring(3, 5), 10);
  const dd = parseInt(cnp.substring(5, 7), 10);

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  let century = 1900;
  let gender: 'M' | 'F' = 'M';

  if (s === 1 || s === 2) {
    century = 1900;
    gender = s === 1 ? 'M' : 'F';
  } else if (s === 3 || s === 4) {
    century = 1800;
    gender = s === 3 ? 'M' : 'F';
  } else if (s === 5 || s === 6) {
    century = 2000;
    gender = s === 5 ? 'M' : 'F';
  } else if (s === 7 || s === 8) {
    century = 1900; // Resident
    gender = s === 7 ? 'M' : 'F';
  }

  const birthYear = century + yy;
  const mmStr = String(mm).padStart(2, '0');
  const ddStr = String(dd).padStart(2, '0');
  const birthDate = `${birthYear}-${mmStr}-${ddStr}`;
  const age = currentYear - birthYear;

  return { birthDate, age, gender };
}

/**
 * Detects count, ages, and birth dates of children from freeform text fields.
 */
export function extractChildrenFromText(
  text: string,
  parentLastName: string,
  explicitChild?: { first_name?: string; cnp?: string; email?: string },
  currentYear = 2026
): ExtractedChild[] {
  const children: ExtractedChild[] = [];
  const lastName = parentLastName || 'Copil';

  // 1. If explicit child column data exists
  if (explicitChild?.first_name || explicitChild?.cnp) {
    let age: number | undefined;
    let birth_date: string | undefined;

    if (explicitChild.cnp) {
      const cnpData = parseCNPBirthData(explicitChild.cnp, currentYear);
      if (cnpData) {
        age = cnpData.age;
        birth_date = cnpData.birthDate;
      }
    }

    children.push({
      first_name: explicitChild.first_name || 'Copil 1',
      last_name: lastName,
      cnp: explicitChild.cnp || '',
      email: explicitChild.email || '',
      age,
      birth_date,
    });
  }

  if (!text || typeof text !== 'string') {
    return children.length > 0 ? children : [];
  }

  const cleanText = text.trim();

  // Extract explicit ages in text like: "5: 19,18,15,13,6", "4 copii (10, 8, 6, 4)", "3 copii 12 ani, 3 ani si 1 an"
  const ageMatches: number[] = [];

  // Match patterns like "X ani", "Xani", "X y"
  const aniRegex = /(\d{1,2})\s*(?:ani|an|luni)/gi;
  let match;
  while ((match = aniRegex.exec(cleanText)) !== null) {
    const ageVal = parseInt(match[1], 10);
    if (ageVal >= 0 && ageVal <= 25) {
      ageMatches.push(ageVal);
    }
  }

  // If no "ani" matches, check parenthesis lists like "(10, 8, 6, 4)" or "5: 19,18,15,13,6"
  if (ageMatches.length === 0) {
    const listMatch = cleanText.match(/(?:\(|:|\b)\s*(\d{1,2}(?:\s*,\s*\d{1,2})+)\s*(?:\)|$)/);
    if (listMatch) {
      const nums = listMatch[1].split(',').map((n) => parseInt(n.trim(), 10));
      nums.forEach((n) => {
        if (!isNaN(n) && n >= 0 && n <= 25) ageMatches.push(n);
      });
    }
  }

  // Check declared child count like "4 copii", "3 copil"
  const countMatch = cleanText.match(/(\d{1,2})\s*(?:copii|copil|copi)/i);
  const declaredCount = countMatch ? parseInt(countMatch[1], 10) : 0;

  const targetCount = Math.max(declaredCount, ageMatches.length);

  if (targetCount > children.length) {
    const needed = targetCount - children.length;
    for (let i = 0; i < needed; i++) {
      const childIndex = children.length + 1;
      const ageVal = ageMatches[i];
      let birth_date: string | undefined;

      if (ageVal !== undefined) {
        const birthYear = currentYear - ageVal;
        birth_date = `${birthYear}-01-01`;
      }

      children.push({
        first_name: `Copil ${childIndex}`,
        last_name: lastName,
        cnp: '',
        age: ageVal,
        birth_date,
      });
    }
  }

  return children;
}
