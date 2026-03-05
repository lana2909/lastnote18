
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

const INPUT_FILE = path.join(__dirname, '../output_kelas/DROPOUT.xlsx');

function generateUsername(name) {
  const parts = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[1]}`; // firstname.lastname
}

function mapClassName(originalName) {
  // Remove XII prefix and trim
  let name = originalName.replace(/^XII\s*/i, '').trim();
  
  // Handle OTO mapping
  if (name.toUpperCase().startsWith('OTO')) {
    const numMatch = name.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      if (num >= 1 && num <= 3) {
        return `TKRO ${num}`;
      } else if (num >= 4) {
        return `TBSM ${num - 3}`; // 4->1, 5->2
      }
    }
  }

  // Handle JKT -> TJKT
  if (name.toUpperCase().startsWith('JKT')) {
    name = name.replace(/^JKT/i, 'TJKT');
  }
  
  // Handle PLG -> PPLG
  if (name.toUpperCase().startsWith('PLG')) {
    name = name.replace(/^PLG/i, 'PPLG');
  }

  // Format consistent spacing
  name = name.replace(/([A-Z])(\d)/, '$1 $2');
  
  return name.toUpperCase();
}

async function main() {
  console.log('--- Importing Dropouts ---');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error('DROPOUT.xlsx not found!');
    return;
  }

  const workbook = XLSX.readFile(INPUT_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const students = XLSX.utils.sheet_to_json(sheet);
  const defaultPassword = await bcrypt.hash('123456', 10);

  let count = 0;

  for (const student of students) {
    const fullName = student['Nama'];
    const originalClass = student['Kelas'] || student['Kelas/Rombel']; 
    
    if (!fullName) {
        console.log(`Skipping invalid row: ${JSON.stringify(student)}`);
        continue;
    }

    // Try to map their original class to our new class system
    let targetClassName = mapClassName(originalClass || 'DROPOUT');
    
    // If class name is "DROPOUT" or "OUT", we check email code
    if (targetClassName.includes('DROP') || targetClassName.includes('OUT')) {
       const email = student['Email'];
       if (email) {
         const match = email.match(/^([a-z]+)/i);
         if (match) {
           const code = match[1].toUpperCase();
           
           // Force assign to first class of major
           if (code === 'JKT') targetClassName = 'TJKT 1';
           else if (code === 'PLG') targetClassName = 'PPLG 1';
           else if (code === 'AKL') targetClassName = 'AKL 1';
           else if (code === 'DKV') targetClassName = 'DKV 1';
           else if (code === 'BCF') targetClassName = 'BCF 1';
           else if (code === 'KLR') targetClassName = 'KLR 1';
           else if (code === 'OTO') targetClassName = 'TKRO 1'; // Default OTO to TKRO 1
           
           console.log(`  Mapping dropout ${fullName} (${code}) -> ${targetClassName}`);
         }
       }
    }

    // Find Class ID
    const { data: classData } = await supabase
      .from('classes')
      .select('id')
      .eq('name', targetClassName)
      .maybeSingle();

    if (!classData) {
      console.log(`  [WARN] Class not found for ${fullName}: "${targetClassName}". Skipping.`);
      continue;
    }

    const username = generateUsername(fullName);
    
    // Check exist
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      console.log(`  [SKIP] User exists: ${username}`);
    } else {
      const { error } = await supabase
        .from('users')
        .insert({
          name: fullName,
          username: username,
          password: defaultPassword,
          role: 'SUBSCRIBER',
          class_id: classData.id,
          is_unlocked: false
        });
        
      if (error) console.error(`  [ERROR] Failed to insert ${username}: ${error.message}`);
      else {
        console.log(`  [OK] Imported ${username} into ${targetClassName}`);
        count++;
      }
    }
  }

  console.log(`--- Imported ${count} dropouts ---`);
}

main();
