
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Fixing Data ---');

  // 1. Find Class TJKT 2
  const { data: classes } = await supabase.from('classes').select('*');
  const tjkt2 = classes.find(c => c.name.includes('TJKT 2'));
  
  if (!tjkt2) {
    console.error('Class TJKT 2 not found!');
    return;
  }
  console.log(`Found Class: ${tjkt2.name} (${tjkt2.id})`);

  // 2. Fix mohammad.nur
  console.log('Updating mohammad.nur...');
  const newPasswordHash = await bcrypt.hash('123456', 10);
  
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      class_id: tjkt2.id,
      role: 'ADMINISTRATOR',
      is_super_admin: true,
      password: newPasswordHash,
      view_as_class_id: null // Reset view
    })
    .eq('username', 'mohammad.nur')
    .select();

  if (updateError) {
    console.error('Error updating mohammad.nur:', updateError);
  } else {
    console.log('Success! Updated mohammad.nur:', updatedUser);
    console.log('New Password for mohammad.nur: 123456');
  }

  // 3. Search for 'maulana' users
  console.log('\n--- Searching for users with "maulana" ---');
  const { data: maulanaUsers } = await supabase
    .from('users')
    .select('id, name, username, role, class_id')
    .ilike('username', '%maulana%');
    
  console.table(maulanaUsers);

  // 4. Search for 'hadi' users
  console.log('\n--- Searching for users with "hadi" ---');
  const { data: hadiUsers } = await supabase
    .from('users')
    .select('id, name, username, role, class_id')
    .ilike('username', '%hadi%');
    
  console.table(hadiUsers);
}

main();
