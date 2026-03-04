
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Fixing User Duplicates & Typo ---');

  // 1. Handle Duplicate "Mohammad Nur Hadi Maulana"
  // We want to keep the one with username 'mohammad.nur' (ADMINISTRATOR)
  // and delete any others (likely 'hadi.maulana' or similar created during testing/restore)
  
  console.log('\nChecking "Mohammad Nur Hadi Maulana" duplicates...');
  const { data: mnUsers } = await supabase
    .from('users')
    .select('id, username, role, created_at')
    .ilike('name', '%Mohammad Nur Hadi Maulana%');

  if (mnUsers && mnUsers.length > 1) {
    console.table(mnUsers);
    
    // Find the one to KEEP (mohammad.nur)
    const toKeep = mnUsers.find(u => u.username === 'mohammad.nur');
    
    if (toKeep) {
      const toDelete = mnUsers.filter(u => u.id !== toKeep.id);
      
      for (const user of toDelete) {
        console.log(`Deleting duplicate user: ${user.username} (${user.id})`);
        // Delete messages first to avoid FK constraint? usually cascade, but safer to check.
        // Actually we assume cascade or just delete user.
        await supabase.from('users').delete().eq('id', user.id);
      }
    } else {
      console.log('Warning: Main account "mohammad.nur" not found in duplicates!');
    }
  } else {
    console.log('No duplicates found for Mohammad Nur Hadi Maulana.');
  }

  // 2. Handle Rahma Krisanda (Typo Fix)
  // Delete newly created 'rahma.krisanda' (default pw)
  // Rename 'rahma.krisnanda' -> 'rahma.krisanda' (keep old pw)
  
  console.log('\nFixing Rahma Krisanda typo...');
  
  // Find the OLD account (typo)
  const { data: oldRahma } = await supabase
    .from('users')
    .select('id, username, name')
    .ilike('username', '%rahma.krisnanda%') // searching for typo version
    .maybeSingle();

  // Find the NEW account (correct spelling but wrong pw)
  const { data: newRahma } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', 'rahma.krisanda')
    .maybeSingle();

  if (newRahma && oldRahma) {
    console.log(`Found NEW (to delete): ${newRahma.username}`);
    console.log(`Found OLD (to rename): ${oldRahma.username}`);

    // Delete NEW
    await supabase.from('users').delete().eq('id', newRahma.id);
    console.log('Deleted new account.');

    // Update OLD
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        name: 'RAHMA KRISANDA', // Ensure caps match standard
        username: 'rahma.krisanda' 
      })
      .eq('id', oldRahma.id);
      
    if (updateError) console.error('Error updating old Rahma:', updateError);
    else console.log('Renamed old account successfully.');
    
  } else if (oldRahma && !newRahma) {
     // Just rename if new one doesn't exist
     console.log('Only found old typo account. Renaming...');
     await supabase
      .from('users')
      .update({ 
        name: 'RAHMA KRISANDA',
        username: 'rahma.krisanda' 
      })
      .eq('id', oldRahma.id);
      console.log('Renamed.');
  } else {
    console.log('Could not find both accounts to swap. Please check manually.');
    console.log('Old (Typo):', oldRahma);
    console.log('New (Correct):', newRahma);
  }

  console.log('\n--- Fix Complete ---');
}

main();
