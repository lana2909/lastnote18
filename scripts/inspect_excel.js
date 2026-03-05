
const XLSX = require('xlsx');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../Cetak Daftar Siswa.xlsx');

function main() {
  console.log(`Reading file: ${INPUT_FILE}`);
  const workbook = XLSX.readFile(INPUT_FILE);
  
  let sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('userpass'));
  if (!sheetName) sheetName = workbook.SheetNames[0];
  
  console.log(`Inspecting sheet: ${sheetName}`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length === 0) return;

  // Print Header
  console.log('\n--- HEADERS ---');
  console.log(data[0].join(' | '));

  // Print First 5 Rows that contain "XII" in any cell
  console.log('\n--- ROWS WITH "XII" ---');
  let found = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowStr = row.join(' | ');
    if (rowStr.includes('XII')) {
      console.log(`Row ${i}:`, rowStr);
      found++;
      if (found >= 5) break;
    }
  }
}

main();
