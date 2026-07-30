import { z } from 'zod';
import { validateCNP } from './cnp';
import { normalizePhone } from './phone';

export const childSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(1, 'Prenumele copilului este obligatoriu.'),
  last_name: z.string().min(1, 'Numele de familie al copilului este obligatoriu.'),
  email: z.string().email('Adresă de e-mail invalidă.').nullable().optional().or(z.literal('')),
  cnp: z.string().refine((val) => validateCNP(val).isValid, {
    message: 'CNP-ul este invalid (trebuie să conțină 13 cifre cu cifră de control validă).',
  }),
  age: z.number().int().min(0).max(18).nullable().optional(),
  birth_date: z.string().nullable().optional(),
});

export const registrationSchema = z.object({
  id: z.string().uuid().optional(),
  source: z.enum(['manual', 'excel_import']).default('manual'),
  registered_at: z.string().optional(),
  parent_first_name: z.string().min(1, 'Prenumele părintelui este obligatoriu.'),
  parent_last_name: z.string().min(1, 'Numele de familie al părintelui este obligatoriu.'),
  primary_email: z.string().email('Adresa principală de email este invalidă.'),
  secondary_email: z.string().email('Adresa secundară de email este invalidă.').nullable().optional().or(z.literal('')),
  phone: z.string().refine((val) => normalizePhone(val).isValid, {
    message: 'Numărul de telefon este invalid (ex: 0721234567).',
  }),
  postal_address: z.string().nullable().optional(),
  county: z.string().min(1, 'Județul este obligatoriu.'),
  city: z.string().min(1, 'Orașul este obligatoriu.'),
  comments: z.string().nullable().optional(),
  privacy_policy_accepted: z.boolean().default(false),
  family_details: z.string().nullable().optional(),
  notification_email: z.string().email('Email-ul de notificare este invalid.').nullable().optional().or(z.literal('')),
  internal_notes: z.string().nullable().optional(),
  children: z.array(childSchema).default([]),
});

export type ChildFormValues = z.infer<typeof childSchema>;
export type RegistrationFormValues = z.infer<typeof registrationSchema>;
