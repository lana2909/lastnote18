
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

async function listTJKT2() {
  console.log('Listing students in TJKT 2...');

  // Get TJKT 2 class ID
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .ilike('name', '%TJKT 2%')
    .single();

  if (!cls) {
    console.error('Class TJKT 2 not found');
    return;
  }

  const { data: students } = await supabase
    .from('users')
    .select('name')
    .eq('class_id', cls.id)
    .order('name');

  if (!students) return;

  console.log(`Total Students found: ${students.length}`);
  students.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name}`);
  });
}

listTJKT2().catch(console.error);
