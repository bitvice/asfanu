# ASFANU CRM - Consolă Administrare Internă & Gestiune Familii înregistrate

Sistem web modern de gestiune a familiilor numeroase înregistrate în cadrul **Asociației ASFANU**. Platforma oferă funcționalități avansate de administrare a membrilor, securitate și protecție a datelor personale (CNP maskat, audit logging), import inteligent din fișiere Excel, analiză grafică în timp real și export securizat.

![ASFANU Logo](public/logo.png)

---

## 🚀 Tehnologii Utilizate

* **Framework Core**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Server Actions)
* **Limbaj**: TypeScript (Strict Mode)
* **Bază de Date & Autentificare**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, SSR Auth)
* **Styling & Design System**: Tailwind CSS v3, `next-themes` (Comutator Light/Dark mode cu fundaluri dinamice custom)
* **Tabel Date & Paginare**: `@tanstack/react-table` v8 (Selectare rânduri în lot, paginare dinamică 10 / 25 / 50 / 100 rânduri)
* **Import & Procesare Excel**: SheetJS (`xlsx`), motor de auto-mapare a coloanelor, detector de duplicate și parser de copii & ani de naștere
* **Testing Frameworks**: [Vitest](https://vitest.dev/) (Teste unitare & integrare), [Playwright](https://playwright.dev/) (Teste E2E)
* **Iconografie**: Lucide React Icons

---

## ✨ Funcționalități Principale

### 1. Registru Înregistrări Familii (`/registrations`)
- **Tabel Paginat & Filtrare**: Căutare rapidă după nume, email, telefon și filtrare după județ/oraș sau acord politica de confidențialitate.
- **Afișare Număr Copii**: Afișează numărul total de copii al fiecărei familii sub formă de badge-uri vizuale.
- **Configurare Număr Înregistrări**: Selector dinamic de paginare (`10`, `25`, `50`, `100` înregistrări pe pagină, implicit **50**).
- **Ștergere Multiplă în Lot (Bulk Delete)**: Posibilitatea de a bifa mai multe înregistrări și de a le șterge simultan printr-un modal custom aliniat pe centrul ecranului (React Portal).
- **Protecție Date Sensibile (CNP Maskat)**: Mascare automată a CNP-urilor copiilor (`5010101******`). Vizualizarea CNP-ului ne-mascat de către administratori declanșează un jurnal de audit.

### 2. Sesiune de Import Inteligent Excel (`/imports/new`)
- **Wizard în 10 Pași**: Ghid pas cu pas pentru încărcarea, maparea și validarea fișierelor Excel `.xlsx`, `.xls` sau `.csv`.
- **Disambiguizare Coloane Duplicate**: Tratare automată a titlurilor identice din Excel (ex: `Nume de familie [1]`, `Nume de familie [2]`).
- **Normalizare Automată**:
  - Telefon: Standardizare format românesc (`07XXXXXXXX`).
  - Nume & Orașe: Title Case (ex: `candea` -> `Candea`, `brasov` -> `Brașov`).
  - Politică Confidențialitate: Evaluare implicită la `DA`.
- **Extragere Număr Copii & Ani de Naștere**: Analizează textul liber din comentarii (ex: `"4 copii minori"`, `"3 copii 12 ani, 3 ani și 1 an"`) și creează automat înregistrările copiilor în baza de date cu calcularea anului de naștere (`YYYY-01-01`) sau data exactă din CNP.
- **Detectare Duplicate**: Algoritm de verificare a duplicatelor bazat pe email, telefon și CNP copil (`exact_duplicate`, `high_confidence`).
- **Indicator Vizual (Loading Spinner)**: Ecran modal cu spinner animat în timpul procesării fișierului și al salvării în baza de date.

### 3. Panou Tablou de Bord & Analitice (`/dashboard`)
- Metrici în timp real: Total familii, total copii înregistrați, distribuție pe județe/orașe și evoluție lunară a înregistrărilor.

### 4. Export Securizat (`/api/export`)
- Descărcare date filtrate în format **XLSX** sau **CSV** cu auditare automată a acțiunii de export.

### 5. Administrare Utilizatori & Audit (`/users` & `/settings`)
- **Control Acces Bazat pe Roluri (RBAC)**:
  - `Admin`: Acces complet (creare, editare, ștergere individuală/bulk, import Excel, promovare roluri, vizualizare CNP ne-mascat).
  - `Operator`: Creare, editare, vizualizare înregistrări.
  - `Viewer`: Vizualizare înregistrări cu CNP maskat.
- **Jurnal Audit**: Monitorizare detaliată a tuturor evenimentelor critice (`READ_CNP`, `EXPORT_REGISTRATIONS`, `CREATE_REGISTRATION`, `UPDATE_REGISTRATION`, `DELETE_REGISTRATION`, `DELETE_MULTIPLE_REGISTRATIONS`, `IMPORT_EXCEL`).

---

## 🛠️ Instalare și Configurare Locală

### 1. Clonare Repozitoriu & Instalare Dependențe

```bash
cd asfanu
npm install
```

### 2. Configurare Variabile de Mediu

Creați fișierul `.env.local` în rădăcina proiectului cu următoarele chei Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Inițializare Bază de Date Supabase

Executați scriptul SQL de migrare din `docs/20260730000001_initial_schema.sql` în Supabase SQL Editor pentru a crea tabelele:
- `profiles`
- `registrations`
- `children`
- `imports`
- `import_rows`
- `audit_logs`

---

## 💻 Comenzi Utile

| Comandă | Descriere |
| :--- | :--- |
| `npm run dev -- -p 4080` | Pornește serverul de dezvoltare local pe portul **4080** |
| `npm run build` | Compilează aplicația pentru producție |
| `npm run start` | Pornește serverul de producție |
| `npm run test` | Execută suita de teste unitare și de integrare cu **Vitest** |
| `npx playwright test` | Execută suitele de testare End-to-End (E2E) |

---

## 📁 Structură Proiect

```text
asfanu/
├── docs/                      # Documentație, schemă SQL & fișiere de date
│   ├── Lista familii inscrise Brasov 05,03,2026.xlsx
│   ├── DEPLOYMENT_GUIDE.md
│   └── SECURITY_AUDIT.md
├── public/                    # Resurse statice (logo, favicon, imagini fundal)
│   ├── bg-light.png
│   ├── bg-dark.png
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── app/                   # Next.js App Router (pagini & API routes)
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── imports/
│   │   │   ├── registrations/
│   │   │   ├── settings/
│   │   │   └── users/
│   │   └── api/
│   │       ├── dashboard/
│   │       └── export/
│   ├── components/            # Componente UI Reutilizabile
│   │   ├── imports/           # ImportWizard & HeaderMapper
│   │   ├── registrations/     # RegistrationsTable & Filters
│   │   ├── shared/            # Header, Sidebar, ThemeToggle
│   │   └── ui/                # Componente Radix / Tailwind
│   ├── features/              # Server Actions pentru înregistrări și importuri
│   ├── lib/                   # Module de validare, securitate și normalizare
│   │   ├── import/            # excel-parser, normalizer, children-parser, auto-mapper, duplicate-detector
│   │   ├── security/          # permissions, audit, cnp-masker
│   │   ├── validation/        # cnp, phone, registration.schema
│   │   └── supabase/          # Clienți Supabase (client, server, middleware)
│   └── services/              # Servicii de date (registrations, auth, import, dashboard)
├── vitest.config.ts           # Configurație teste Vitest
└── playwright.config.ts       # Configurație teste E2E
```

---

## 🔒 Securitate și Conformitate GDPR

- Toate datele cu caracter personal sensibile (CNP copil) sunt maskate implicit.
- Toate operațiunile de vizualizare CNP ne-mascat, export sau ștergere sunt înregistrate imutabil în tabela `audit_logs`.
- Accesul la rute și acțiuni este protejat prin politici RLS (Row Level Security) în Supabase și middleware-ul de sesiune Next.js.
