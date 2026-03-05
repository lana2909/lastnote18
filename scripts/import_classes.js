
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = path.join(__dirname, '../output_kelas');

function generateUsername(name) {
  const parts = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[1]}`; // firstname.lastname
}

async function getThemeId(className) {
  // Simple theme assignment logic based on class name/major
  let themeName = 'Modern Dark'; // Default
  
  if (className.includes('AKL')) themeName = 'Modern Dark';
  else if (className.includes('DKV')) themeName = 'Neon Cyberpunk';
  else if (className.includes('TKRO') || className.includes('TBSM')) themeName = 'Midnight Blue';
  else if (className.includes('BCF')) themeName = 'Sunset Vibes';
  else if (className.includes('KLR')) themeName = 'Forest Green';
  else if (className.includes('PPLG')) themeName = 'Deep Space';
  else if (className.includes('TJKT')) themeName = 'Royal Purple';

  const { data: theme } = await supabase
    .from('themes')
    .select('id')
    .ilike('name', `%${themeName}%`)
    .maybeSingle();

  if (theme) return theme.id;
  
  // Fallback to any theme
  const { data: anyTheme } = await supabase.from('themes').select('id').limit(1).single();
  return anyTheme?.id;
}

function mapClassName(originalName) {
  // Remove XII prefix and trim
  let name = originalName.replace(/^XII\s*/i, '').trim();
  
  // Handle OTO mapping
  // OTO 1 -> TKRO 1
  // OTO 2 -> TKRO 2
  // OTO 3 -> TKRO 3
  // OTO 4 -> TBSM 1
  // OTO 5 -> TBSM 2
  
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

  // Format consistent spacing (e.g. AKL1 -> AKL 1)
  // Insert space between letters and numbers if missing
  name = name.replace(/([A-Z])(\d)/, '$1 $2');
  
  return name.toUpperCase();
}

async function main() {
  console.log('--- Importing Classes (Excluding TJKT 2) ---');

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error('Output directory not found!');
    return;
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.xlsx') && f.toUpperCase().startsWith('XII'));
  const defaultPassword = await bcrypt.hash('123456', 10);

  for (const file of files) {
    // Exclude TJKT 2 (already handled)
    if (file.toUpperCase().includes('JKT2') || file.toUpperCase().includes('JKT 2')) {
      console.log(`[SKIP] Excluded file: ${file}`);
      continue;
    }

    console.log(`\nProcessing: ${file}`);
    const filePath = path.join(OUTPUT_DIR, file);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = XLSX.utils.sheet_to_json(sheet);

    if (students.length === 0) {
      console.log('  -> Empty file, skipping.');
      continue;
    }

    // Determine Class Name from first student's "Kelas" field or filename
    const firstStudent = students[0];
    const originalClassName = firstStudent['Kelas'] || file.replace('.xlsx', '');
    const newClassName = mapClassName(originalClassName);
    
    console.log(`  -> Class Name: ${newClassName} (from ${originalClassName})`);

    // 1. Create/Get Class
    const themeId = await getThemeId(newClassName);
    
    // Check if class exists
    let { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('name', newClassName)
      .maybeSingle();

    if (!classData) {
      console.log(`  -> Creating Class: ${newClassName}`);
      const { data: newClass, error: createError } = await supabase
        .from('classes')
        .insert({ name: newClassName, theme_id: themeId })
        .select()
        .single();
      
      if (createError) {
        console.error(`  -> Error creating class: ${createError.message}`);
        continue;
      }
      classData = newClass;
    } else {
      console.log(`  -> Class exists: ${newClassName} (${classData.id})`);
    }

    // 2. Import Students
    let count = 0;
    for (const student of students) {
      const fullName = student['Nama'];
      if (!fullName) continue;

      const username = generateUsername(fullName);
      
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        console.log(`    [SKIP] User exists: ${username}`);
        // Optional: Update class_id if needed?
        // await supabase.from('users').update({ class_id: classData.id }).eq('id', existingUser.id);
      } else {
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            name: fullName,
            username: username,
            password: defaultPassword,
            role: 'SUBSCRIBER',
            class_id: classData.id,
            is_unlocked: false
          });
          
        if (createUserError) {
          console.error(`    [ERROR] Failed to create ${username}: ${createUserError.message}`);
        } else {
          count++;
        }
      }
    }
    console.log(`  -> Imported ${count} new students.`);
  }

  console.log('\n--- Import Complete ---');
}

main();
