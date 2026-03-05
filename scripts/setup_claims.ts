
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
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

async function setupClaims() {
  console.log('Starting Claims Setup...');

  // 1. Read Excel
  const excelPath = path.resolve(__dirname, '../Cetak Daftar Siswa.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('Excel file not found:', excelPath);
    return;
  }

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Read ${rows.length} rows from Excel.`);

  const claims: any[] = [];
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const name = row['NAMA'];
    const email = row['MAIL'];

    if (!name || !email) {
      console.log('Skipping row with missing name or email:', row);
      continue;
    }

    // 2. Find User in DB
    // Try exact match first
    let { data: user, error } = await supabase
      .from('users')
      .select('id, name')
      .ilike('name', name) // Case insensitive match
      .maybeSingle();

    if (!user) {
      // Try fuzzy match? Or just log error.
      // Maybe name format differs (e.g. Title Case vs Upper Case) -> ilike handles case.
      // Maybe extra spaces?
      // Trim name
      const cleanName = name.trim();
      const { data: user2 } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', cleanName)
        .maybeSingle();
      
      user = user2;
    }

    if (!user) {
      console.log(`User not found in DB: ${name}`);
      skippedCount++;
      continue;
    }

    // 3. Generate Token
    const token = crypto.randomBytes(32).toString('hex');

    // 4. Update User
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: email,
        claim_token: token
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`Failed to update ${name}:`, updateError.message);
      continue;
    }

    console.log(`Updated ${name} with token.`);
    updatedCount++;

    // 5. Add to claims list for email sending
    claims.push({
      name: user.name,
      email: email,
      token: token,
      link: `${process.env.NEXTAUTH_URL}/claim/${token}`
    });
  }

  // 6. Save Claims to JSON
  fs.writeFileSync(
    path.resolve(__dirname, '../claims_data.json'),
    JSON.stringify(claims, null, 2)
  );

  console.log('\nClaims Setup Completed!');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Claims data saved to claims_data.json`);
}

setupClaims().catch(console.error);
