
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Classes ---');
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('*');
  
  if (classError) console.error(classError);
  else console.table(classes.map(c => ({ id: c.id, name: c.name })));

  const tjkt2 = classes?.find(c => c.name.includes('TJKT 2'));
  
  if (tjkt2) {
    console.log(`\n--- Users in ${tjkt2.name} (${tjkt2.id}) ---`);
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, username, role, is_super_admin')
      .eq('class_id', tjkt2.id);
      
    if (userError) console.error(userError);
    else {
      console.log(`Total Users: ${users.length}`);
      console.table(users);
    }
  } else {
    console.log('Class TJKT 2 not found');
  }

  console.log('\n--- Specific User: mohammad.nur ---');
  const { data: mn, error: mnError } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'mohammad.nur')
    .maybeSingle();
    
  if (mnError) console.error(mnError);
  console.log(mn || 'User mohammad.nur not found');

  console.log('\n--- Specific User: maulana.hadi ---');
  const { data: mh, error: mhError } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'maulana.hadi')
    .maybeSingle();
    
  if (mhError) console.error(mhError);
  console.log(mh || 'User maulana.hadi not found');
}

main();
