
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. List all users in TJKT 2 to find the correct name/username
  const { data: tjkt2 } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'TJKT 2')
    .single();

  if (!tjkt2) {
    console.log('Class TJKT 2 not found');
    return;
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, name, username, role, is_super_admin')
    .eq('class_id', tjkt2.id);

  console.log('Users in TJKT 2:', users);

  // 2. Ensure your account is set up correctly
  const myName = 'Mohammad Nur Hadi Maulana';
  const myUser = users?.find(u => u.name === myName);

  if (myUser) {
    console.log('Found you:', myUser);
    
    // Ensure you are ADMINISTRATOR
    if (myUser.role !== 'ADMINISTRATOR') {
       console.log('Updating role to ADMINISTRATOR...');
       await supabase
         .from('users')
         .update({ role: 'ADMINISTRATOR', is_super_admin: true })
         .eq('id', myUser.id);
       console.log('Role updated.');
    }
    
    // Reset password again just for you to be absolutely sure
    const hashedPassword = await bcrypt.hash('12345678', 10);
    await supabase.from('users').update({ password: hashedPassword }).eq('id', myUser.id);
    console.log('Password reset for your account specifically.');

  } else {
    console.log('Could not find user with name:', myName);
    // Maybe create it if missing? Or maybe the name is slightly different?
  }
}

debugUser();
