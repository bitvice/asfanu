import { describe, it, expect } from 'vitest';
import { extractChildrenFromText, parseCNPBirthData } from './children-parser';

describe('parseCNPBirthData', () => {
  it('should parse birth date and age from CNP starting with 5 (male born post 2000)', () => {
    const res = parseCNPBirthData('5100315123456', 2026);
    expect(res).not.toBeNull();
    expect(res?.birthDate).toBe('2010-03-15');
    expect(res?.age).toBe(16);
    expect(res?.gender).toBe('M');
  });

  it('should parse birth date and age from CNP starting with 6 (female born post 2000)', () => {
    const res = parseCNPBirthData('6150820123456', 2026);
    expect(res).not.toBeNull();
    expect(res?.birthDate).toBe('2015-08-20');
    expect(res?.age).toBe(11);
    expect(res?.gender).toBe('F');
  });
});

describe('extractChildrenFromText', () => {
  it('should detect 3 children and calculate birth dates from "3 copii 12 ani, 3 ani si 1 an"', () => {
    const children = extractChildrenFromText('3 copii 12 ani, 3 ani si 1 an', 'Popescu', undefined, 2026);
    expect(children.length).toBe(3);
    expect(children[0].age).toBe(12);
    expect(children[0].birth_date).toBe('2014-01-01');
    expect(children[1].age).toBe(3);
    expect(children[1].birth_date).toBe('2023-01-01');
    expect(children[2].age).toBe(1);
    expect(children[2].birth_date).toBe('2025-01-01');
  });

  it('should detect 5 children from parenthesis lists "5 ( 10, 8, 6, 4, 2)"', () => {
    const children = extractChildrenFromText('5 ( 10, 8, 6, 4, 2)', 'Bidalac', undefined, 2026);
    expect(children.length).toBe(5);
    expect(children[0].age).toBe(10);
    expect(children[0].birth_date).toBe('2016-01-01');
    expect(children[4].age).toBe(2);
    expect(children[4].birth_date).toBe('2024-01-01');
  });

  it('should create child records even if only declared count "4 copii minori" is given without names', () => {
    const children = extractChildrenFromText('Da 4 copii minori', 'Balasz', undefined, 2026);
    expect(children.length).toBe(4);
    expect(children[0].first_name).toBe('Copil 1');
    expect(children[0].last_name).toBe('Balasz');
    expect(children[3].first_name).toBe('Copil 4');
  });
});
