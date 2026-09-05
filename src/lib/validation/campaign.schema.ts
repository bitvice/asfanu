import { z } from 'zod';

export const campaignSchema = z.object({
  name: z
    .string()
    .min(3, 'Denumirea campaniei trebuie să aibă minim 3 caractere.')
    .max(200, 'Denumirea campaniei nu poate depăși 200 de caractere.'),
  slug: z
    .string()
    .min(2, 'Slug-ul trebuie să aibă minim 2 caractere.')
    .max(100, 'Slug-ul nu poate depăși 100 de caractere.')
    .regex(/^[a-z0-9-]+$/, 'Slug-ul poate conține doar litere mici, cifre și cratime.'),
  code_slug: z
    .string()
    .length(3, 'Slug-ul codului trebuie să aibă exact 3 caractere.')
    .regex(/^[A-Za-z0-9]{3}$/, 'Slug-ul codului poate conține doar 3 litere sau cifre.')
    .transform((val) => val.toUpperCase())
    .default('ASF'),
  discount_percentage: z
    .number({ invalid_type_error: 'Procentul de reducere trebuie să fie un număr.' })
    .int('Procentul trebuie să fie un număr întreg.')
    .min(1, 'Reducerea minimă este 1%.')
    .max(100, 'Reducerea maximă este 100%.'),
  description: z
    .string()
    .max(2000, 'Descrierea nu poate depăși 2000 de caractere.')
    .optional()
    .nullable(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

export const cardTemplateConfigSchema = z.object({
  mode: z.enum(['gradient', 'custom_image']).default('gradient'),
  bg_gradient_from: z.string().default('#4f46e5'),
  bg_gradient_to: z.string().default('#7c3aed'),
  text_color: z.string().default('#ffffff'),
  accent_color: z.string().default('#fbbf24'),
  layout: z.string().default('default'),
  card_background_url: z.string().optional().nullable(),
  coupon_code_x: z.number().min(0).max(100).default(49.5),
  coupon_code_y: z.number().min(0).max(100).default(70.0),
  coupon_code_font_size: z.number().min(8).max(48).default(15),
  coupon_code_color: z.string().default('#ffffff'),
  coupon_code_bg: z.string().default('transparent'),
  show_family_name: z.boolean().default(true),
  family_name_x: z.number().min(0).max(100).default(50),
  family_name_y: z.number().min(0).max(100).default(76.5),
  family_name_font_size: z.number().min(8).max(36).default(11),
  family_name_color: z.string().default('#ffffff'),
  show_issued_date: z.boolean().default(true),
  issued_date_x: z.number().min(0).max(100).default(92),
  issued_date_y: z.number().min(0).max(100).default(96.5),
  issued_date_font_size: z.number().min(6).max(24).default(9),
  issued_date_color: z.string().default('#ffffff'),
});

export type CardTemplateConfigValues = z.infer<typeof cardTemplateConfigSchema>;
export type CampaignFormValues = z.infer<typeof campaignSchema>;
