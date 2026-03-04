
import { supabaseServer } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';

async function createTestAdmin() {
  const supabase = supabaseServer();
  const password = await bcrypt.hash('admin123', 10);
  
  const { data, error } = await supabase.from('users').upsert({
    username: 'admin.test',
    name: 'Test Admin',
    password: password,
    role: 'ADMIN',
    is_super_admin: true,
    is_unlocked: true
  }, { onConflict: 'username' }).select();

  if (error) {
    console.error('Error creating test admin:', error);
  } else {
    console.log('Test admin created/updated:', data);
  }
}

createTestAdmin();
