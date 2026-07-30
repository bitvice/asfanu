const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.resolve(__dirname, '../docs/Lista familii inscrise Brasov 05,03,2026.xlsx');
console.log('Loading file:', filePath);

const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

console.log('Sheet names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('\nTotal rows in sheet:', rawData.length);
console.log('\nHeader Row (Row 0):');
console.log(rawData[0]);

console.log('\nSample Rows (Rows 1 to 10):');
rawData.slice(1, 10).forEach((row, idx) => {
  console.log(`\n--- Row ${idx + 1} ---`);
  row.forEach((val, colIdx) => {
    if (val !== '') {
      console.log(`Col ${colIdx} (${rawData[0][colIdx] || 'EMPTY_HEADER'}): "${val}"`);
    }
  });
});
