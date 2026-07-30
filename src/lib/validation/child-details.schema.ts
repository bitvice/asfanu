import { z } from 'zod';
import { parseBirthDate } from '@/lib/children/age';
import { validateCNP } from './cnp';

export const childDetailsSchema = z.object({
  first_name: z.string().trim().min(1, 'Prenumele copilului este obligatoriu.'),
  last_name: z.string().trim().min(1, 'Numele de familie al copilului este obligatoriu.'),
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Adresa de email este invalidă.',
    }),
  cnp: z
    .string()
    .trim()
    .refine((value) => value === '' || validateCNP(value).isValid, {
      message: 'CNP-ul introdus este invalid.',
    }),
  birth_date: z
    .string()
    .trim()
    .refine((value) => value === '' || parseBirthDate(value) !== null, {
      message: 'Data nașterii este invalidă.',
    })
    .refine((value) => value === '' || new Date(`${value}T00:00:00Z`) <= new Date(), {
      message: 'Data nașterii nu poate fi în viitor.',
    }),
});

export type ChildDetailsValues = z.infer<typeof childDetailsSchema>;
