
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Cleaning Up Imported Classes ---');

  // 1. Delete the accidental EMPTY class (from XII.xlsx)
  const { data: emptyClass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', '')
    .maybeSingle();

  if (emptyClass) {
    console.log(`Deleting empty class "${emptyClass.name}" (${emptyClass.id})...`);
    // Delete users first
    const { count } = await supabase
      .from('users')
      .delete({ count: 'exact' })
      .eq('class_id', emptyClass.id);
    
    console.log(`  -> Deleted ${count} users.`);
    
    // Delete class
    await supabase.from('classes').delete().eq('id', emptyClass.id);
    console.log('  -> Deleted class.');
  } else {
    console.log('No empty class found.');
  }

  // 2. Rename JKT -> TJKT
  console.log('\nFixing Class Names (JKT -> TJKT)...');
  const { data: jktClasses } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', 'JKT%')
    .not('name', 'ilike', 'TJKT%'); // Exclude already correct ones

  if (jktClasses && jktClasses.length > 0) {
    for (const cls of jktClasses) {
      const newName = cls.name.replace(/^JKT/, 'TJKT');
      console.log(`Renaming "${cls.name}" -> "${newName}"`);
      await supabase.from('classes').update({ name: newName }).eq('id', cls.id);
    }
  } else {
    console.log('No "JKT" classes found (maybe already TJKT).');
  }

  // 3. Rename PLG -> PPLG
  console.log('\nFixing Class Names (PLG -> PPLG)...');
  const { data: plgClasses } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', 'PLG%')
    .not('name', 'ilike', 'PPLG%');

  if (plgClasses && plgClasses.length > 0) {
    for (const cls of plgClasses) {
      const newName = cls.name.replace(/^PLG/, 'PPLG');
      console.log(`Renaming "${cls.name}" -> "${newName}"`);
      await supabase.from('classes').update({ name: newName }).eq('id', cls.id);
    }
  } else {
    console.log('No "PLG" classes found.');
  }
  
  // 4. Rename KLR -> KULINER (Optional, usually KLR is fine, but standard is Kuliner?)
  // Let's stick to user provided map: klr -> KLR. So KLR is fine.
  
  console.log('\n--- Cleanup Complete ---');
}

main();
