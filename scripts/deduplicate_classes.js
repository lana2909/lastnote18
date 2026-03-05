
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Deduplicating Classes ---');

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .order('name');

  const seen = {}; // name -> id

  for (const cls of classes) {
    const name = cls.name.trim(); // Normalize name
    
    if (seen[name]) {
      const keepId = seen[name];
      const deleteId = cls.id;
      
      console.log(`Duplicate found: "${name}" (Keep: ${keepId}, Delete: ${deleteId})`);
      
      // Move users
      const { count } = await supabase
        .from('users')
        .update({ class_id: keepId })
        .eq('class_id', deleteId)
        .select(); // Need select to get count? Or just update.
      
      console.log(`  -> Moved users.`); // Count not returned easily in v2 without select count
      
      // Delete class
      await supabase.from('classes').delete().eq('id', deleteId);
      console.log(`  -> Deleted duplicate class.`);
      
    } else {
      seen[name] = cls.id;
    }
  }
  
  console.log('--- Deduplication Complete ---');
}

main();
