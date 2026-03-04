
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function resetPasswords() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars:', { 
      url: !!supabaseUrl, 
      key: !!serviceRoleKey 
    });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  console.log('Resetting all passwords to 12345678...');
  
  const defaultPassword = '12345678';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Update ALL users
  const { error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all valid users

  if (error) {
    console.error('Error resetting passwords:', error);
  } else {
    console.log('Successfully reset all passwords to 12345678.');
  }

  // Also verify your user role is correct
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, name, role, is_super_admin')
    .eq('name', 'Mohammad Nur Hadi Maulana')
    .single();

  console.log('Your User Status:', adminUser);
}

resetPasswords();
