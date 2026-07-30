const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const inputFilePath = path.resolve(__dirname, '../docs/Lista familii inscrise Brasov 05,03,2026.xlsx');
const outputFilePath = path.resolve(__dirname, '../docs/Lista_familii_inscrise_Brasov_curatat.xlsx');

const buffer = fs.readFileSync(inputFilePath);
const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('Read total raw rows:', rawRows.length);

// Helpers
function cleanString(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  str = str.replace(/\s+/g, ' ');
  return str;
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');
}

function normalizePhone(val) {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('07')) return digits;
  if (digits.length === 9 && digits.startsWith('7')) return '0' + digits;
  if (digits.length === 11 && digits.startsWith('40')) return '0' + digits.slice(2);
  if (digits.length === 12 && digits.startsWith('407')) return '0' + digits.slice(2);
  return digits ? digits : '';
}

function normalizeDate(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toLocaleDateString('ro-RO');
  const str = String(val);
  const match = str.match(/(\d{2})[.\/-](\d{2})[.\/-](\d{4})/);
  if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('ro-RO');
  } catch {}
  return cleanString(str);
}

// Cleaned Headers
const CLEAN_HEADERS = [
  'ID',
  'Marcaj de Timp',
  'Nume Părinte',
  'Prenume Părinte',
  'Email Principal',
  'Telefon',
  'Adresă Poștală',
  'Județ',
  'Oraș',
  'Acord Politică Confidențialitate',
  'Detalii Copii & Familie',
  'Prenume Copil',
  'Nume Copil',
  'CNP Copil',
  'Email Notificare',
  'Observații / Comentarii'
];

const cleanedData = [CLEAN_HEADERS];

rawRows.slice(1).forEach((row, idx) => {
  const id = cleanString(row[0]) || String(idx + 1);
  const registeredAt = normalizeDate(row[1]);
  const parentLastName = toTitleCase(cleanString(row[2]));
  const parentFirstName = toTitleCase(cleanString(row[3]));

  // Check email candidates in row[5], row[6]
  let primaryEmail = '';
  let phoneCandidate = '';

  const c5 = cleanString(row[5]);
  const c6 = cleanString(row[6]);

  if (c5.includes('@')) primaryEmail = c5.toLowerCase();
  if (c6.includes('@')) {
    if (!primaryEmail) primaryEmail = c6.toLowerCase();
  } else if (c6) {
    phoneCandidate = c6;
  }

  // Address and phone candidates in row[7], row[8]
  const c7 = cleanString(row[7]);
  const c8 = cleanString(row[8]);

  let address = '';
  if (c7 && !c7.match(/^\d+$/)) address = c7;
  if (c8 && !c8.match(/^\d+$/)) {
    address = address ? `${address}, ${c8}` : c8;
  }

  const phone = normalizePhone(phoneCandidate || (c7.match(/^\d+$/) ? c7 : ''));
  let county = toTitleCase(cleanString(row[9])) || 'Brașov';
  if (county.toLowerCase().includes('brasov')) county = 'Brașov';

  let city = toTitleCase(cleanString(row[10]));
  let comments = cleanString(row[11]);
  let privacy = 'NU';

  if (comments.toLowerCase().startsWith('da')) {
    privacy = 'DA';
    comments = comments.slice(2).trim();
  }

  const childAges = cleanString(row[12]) || cleanString(row[13]);
  const childFirstName = toTitleCase(cleanString(row[14]));
  const childCNP = cleanString(row[15]);
  const childEmail = cleanString(row[16]);
  const familyDetails = cleanString(row[17]);
  const notificationEmail = cleanString(row[18]);
  const extraNotes = cleanString(row[19]);

  const allDetails = [childAges, familyDetails, comments].filter(Boolean).join(' | ');

  cleanedData.push([
    id,
    registeredAt,
    parentLastName,
    parentFirstName,
    primaryEmail,
    phone,
    address,
    county,
    city,
    privacy,
    allDetails,
    childFirstName,
    parentLastName,
    childCNP,
    notificationEmail || childEmail,
    extraNotes
  ]);
});

console.log('Cleaned Total Rows:', cleanedData.length);
console.log('Sample Cleaned Row 1:', cleanedData[1]);
console.log('Sample Cleaned Row 2:', cleanedData[2]);

// Write cleaned workbook
const newWorksheet = XLSX.utils.aoa_to_sheet(cleanedData);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Înregistrări Curățate');

XLSX.writeFile(newWorkbook, outputFilePath);
console.log('\nSuccessfully generated cleaned Excel file at:', outputFilePath);

// Also overwrite the original file so that the user and app have cleaned data in place
XLSX.writeFile(newWorkbook, inputFilePath);
console.log('Successfully updated original Excel file at:', inputFilePath);
