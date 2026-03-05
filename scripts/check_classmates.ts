
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkClassmates() {
  console.log('Checking classmates for Mohammad Nur Hadi Maulana...');

  // 1. Get Admin User
  const { data: admin, error: adminError } = await supabase
    .from('users')
    .select('id, name, class_id, role')
    .ilike('name', '%Mohammad Nur Hadi Maulana%')
    .single();

  if (adminError || !admin) {
    console.error('Admin not found:', adminError?.message);
    return;
  }

  console.log(`Admin: ${admin.name} (Role: ${admin.role})`);
  console.log(`Class ID: ${admin.class_id}`);

  // 2. Get Keysha and Dicky
  const { data: targets, error: targetError } = await supabase
    .from('users')
    .select('id, name, class_id')
    .or('name.ilike.%Keyshafana%,name.ilike.%Dicky Darmawan%');

  if (targetError) {
    console.error('Error fetching targets:', targetError.message);
  }

  console.log('\nTarget Users found:');
  targets?.forEach(u => {
    console.log(`- ${u.name}`);
    console.log(`  Class ID: ${u.class_id}`);
    console.log(`  Match? ${u.class_id === admin.class_id ? 'YES' : 'NO'}`);
  });

  if (targets?.length === 0) {
    console.log('Keyshafana and Dicky not found in DB!');
  }

  // 3. Check Messages count
  const { count: msgCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });
    
  console.log(`\nTotal Messages in DB: ${msgCount}`);
}

checkClassmates().catch(console.error);
