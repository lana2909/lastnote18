
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = path.join(__dirname, '../credentials');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  console.log('--- Generating Credentials ---');
  
  ensureDir(OUTPUT_DIR);

  // 1. Get All Classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .order('name');

  if (!classes || classes.length === 0) {
    console.log('No classes found.');
    return;
  }

  for (const cls of classes) {
    const className = cls.name;
    const safeName = className.replace(/[\\/:*?"<>|]/g, '_');
    
    console.log(`Processing ${className}...`);

    // 2. Get Users for Class
    const { data: users } = await supabase
      .from('users')
      .select('name, username, role')
      .eq('class_id', cls.id)
      .order('name');

    if (!users || users.length === 0) {
      console.log(`  -> No users found.`);
      continue;
    }

    // 3. Format Data
    const rows = users.map((u, index) => ({
      No: index + 1,
      Name: u.name,
      Username: u.username,
      Password: '123456' // Default password for everyone
    }));

    // 4. Create Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // Auto-width columns
    const wscols = [
      { wch: 5 },  // No
      { wch: 35 }, // Name
      { wch: 25 }, // Username
      { wch: 15 }  // Password
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Credentials");
    
    const filePath = path.join(OUTPUT_DIR, `Credentials_${safeName}.xlsx`);
    XLSX.writeFile(wb, filePath);
    
    console.log(`  -> Created ${filePath} (${users.length} users)`);
  }

  console.log('--- Generation Complete ---');
}

main();
