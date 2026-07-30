const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.resolve(__dirname, '../docs/Lista familii inscrise Brasov 05,03,2026.xlsx');
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('Total Rows:', rawData.length);
console.log('Headers:', rawData[0]);

// Helper detection
function isEmail(str) {
  return typeof str === 'string' && str.includes('@') && str.includes('.');
}

function isPhone(str) {
  if (typeof str !== 'string' && typeof str !== 'number') return false;
  const digits = String(str).replace(/\D/g, '');
  return (digits.length >= 9 && digits.length <= 13) || String(str).startsWith('7') || String(str).startsWith('07');
}

function isCNP(str) {
  if (typeof str !== 'string' && typeof str !== 'number') return false;
  const digits = String(str).replace(/\D/g, '');
  return digits.length === 13;
}

function isDate(val) {
  if (val instanceof Date) return true;
  if (typeof val === 'string' && (val.includes('GMT') || val.match(/\d{2}\.\d{2}\.\d{4}/) || val.match(/\d{4}-\d{2}-\d{2}/))) return true;
  return false;
}

// Analyze each row
const rowsInfo = rawData.slice(1).map((row, idx) => {
  const nonCols = {};
  row.forEach((val, i) => {
    if (val !== '') nonCols[i] = val;
  });
  return { rowNum: idx + 2, raw: row, filledCols: Object.keys(nonCols).map(Number) };
});

console.log('\nRow Count with data:', rowsInfo.length);

// Print detailed inspection of first 20 rows
rowsInfo.slice(0, 20).forEach((r) => {
  console.log(`\nRow #${r.rowNum}:`);
  r.raw.forEach((val, colIdx) => {
    if (val !== '') {
      console.log(`  Col [${colIdx}] (${rawData[0][colIdx]}): "${val}"`);
    }
  });
});
