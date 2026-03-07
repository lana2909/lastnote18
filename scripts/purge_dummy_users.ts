
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as XLSX from 'xlsx';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function purgeDummyUsers() {
  console.log('Starting comprehensive cleanup of dummy users...');

  // 1. Delete from Database
  // Patterns: "Admin %", "Siswa %", "Admin 2 %", "Siswa Biasa %"
  // Using ILIKE with wildcards
  
  const patterns = ['Admin %', 'Siswa %', 'Test Admin%', 'Admin.%'];
  
  let totalDeletedDB = 0;

  for (const pattern of patterns) {
    const { error, count } = await supabase
      .from('users')
      .delete({ count: 'exact' })
      .ilike('name', pattern);
      
    if (error) {
      console.error(`Error deleting pattern '${pattern}':`, error.message);
    } else {
      console.log(`Deleted ${count} users matching '${pattern}' from DB.`);
      totalDeletedDB += (count || 0);
    }
  }
  
  console.log(`Total DB users deleted: ${totalDeletedDB}`);

  // 2. Clean up Excel Credentials Files
  const credentialsDir = path.resolve(__dirname, '../credentials');
  if (fs.existsSync(credentialsDir)) {
    const files = fs.readdirSync(credentialsDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
    let totalDeletedExcel = 0;

    for (const file of files) {
      const filePath = path.join(credentialsDir, file);
      try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        let rows: any[] = XLSX.utils.sheet_to_json(sheet);
        const originalCount = rows.length;
        
        // Filter out dummy rows
        rows = rows.filter(row => {
          const name = (row['Name'] || '').toString().trim();
          // Check if name starts with Admin or Siswa
          if (name.match(/^(Admin|Siswa)\s/i) || name === 'Test Admin') {
            return false; // Remove
          }
          return true; // Keep
        });
        
        const newCount = rows.length;
        const deletedInFile = originalCount - newCount;
        
        if (deletedInFile > 0) {
          // Save back
          const newSheet = XLSX.utils.json_to_sheet(rows, { header: ['No', 'Name', 'Username', 'Password', 'Email'] });
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
          XLSX.writeFile(newWorkbook, filePath);
          
          console.log(`Cleaned ${deletedInFile} rows from ${file}`);
          totalDeletedExcel += deletedInFile;
        }
      } catch (err: any) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }
    console.log(`Total Excel rows cleaned: ${totalDeletedExcel}`);
  }
}

purgeDummyUsers().catch(console.error);
