
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

async function updateCredentialsWithEmails() {
  console.log('Starting Credentials Update...');

  // 1. Read Master List (Cetak Daftar Siswa.xlsx)
  const masterPath = path.resolve(__dirname, '../Cetak Daftar Siswa.xlsx');
  if (!fs.existsSync(masterPath)) {
    console.error('Master file not found:', masterPath);
    return;
  }

  const masterWorkbook = XLSX.readFile(masterPath);
  const masterSheet = masterWorkbook.Sheets[masterWorkbook.SheetNames[0]];
  const masterData: any[] = XLSX.utils.sheet_to_json(masterSheet);
  
  // Create Name -> Email Map
  const emailMap = new Map<string, string>();
  masterData.forEach(row => {
    const name = row['NAMA'];
    const email = row['MAIL'];
    if (name && email) {
      emailMap.set(name.trim().toUpperCase(), email.trim());
    }
  });

  console.log(`Loaded ${emailMap.size} emails from master list.`);

  // 2. Process Credentials Files
  const credentialsDir = path.resolve(__dirname, '../credentials');
  if (!fs.existsSync(credentialsDir)) {
    console.error('Credentials directory not found:', credentialsDir);
    return;
  }

  const files = fs.readdirSync(credentialsDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
  
  let totalUpdated = 0;

  for (const file of files) {
    const filePath = path.join(credentialsDir, file);
    console.log(`Processing ${file}...`);

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Read as JSON with headers
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      
      if (rows.length === 0) continue;

      // Update rows with Email
      const updatedRows = rows.map(row => {
        const name = row['Name'];
        if (name) {
          const email = emailMap.get(name.trim().toUpperCase());
          if (email) {
            return { ...row, Email: email };
          } else {
             console.warn(`  Email not found for: ${name}`);
             return { ...row, Email: '' }; // Or keep empty
          }
        }
        return row;
      });

      // Convert back to sheet
      const newSheet = XLSX.utils.json_to_sheet(updatedRows, { header: ['No', 'Name', 'Username', 'Password', 'Email'] });
      
      // Create new workbook
      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
      
      // Write file (overwrite)
      XLSX.writeFile(newWorkbook, filePath);
      
      console.log(`  Updated ${updatedRows.length} rows in ${file}`);
      totalUpdated += updatedRows.length;

    } catch (error: any) {
      console.error(`  Error processing ${file}:`, error.message);
    }
  }

  console.log(`\nUpdate Completed! Total updated rows: ${totalUpdated}`);
}

updateCredentialsWithEmails().catch(console.error);
