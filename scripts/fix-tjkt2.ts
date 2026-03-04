
import { supabaseServer } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixTJKT2() {
  const supabase = supabaseServer();
  
  // 1. Get TJKT 2 Class ID
  const { data: tjkt2, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'TJKT 2')
    .single();

  if (classError || !tjkt2) {
    console.error('TJKT 2 not found');
    return;
  }

  // 2. Delete all existing users in TJKT 2 (Clean slate)
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('class_id', tjkt2.id);

  if (deleteError) {
    console.error('Error deleting users:', deleteError);
    return;
  }

  console.log('Cleared TJKT 2 users.');

  // 3. Create "You" (Mohammad Nur Hadi Maulana) at absent 21
  const password = await bcrypt.hash('12345678', 10);
  
  // Create 35 other students + 1 You = 36 total
  // Absent 1-20: Student 1-20
  // Absent 21: Mohammad Nur Hadi Maulana (Admin?)
  // Absent 22-36: Student 22-36
  
  const users = [];

  // Create You
  users.push({
    name: 'Mohammad Nur Hadi Maulana',
    username: 'hadi.maulana', // Or your preferred username
    password: password,
    role: 'ADMIN', // Assuming you want admin access for your class
    class_id: tjkt2.id,
    absent_no: 21,
    is_unlocked: true,
    is_super_admin: true // You requested full view access
  });

  // Create other 35 students
  for (let i = 1; i <= 36; i++) {
    if (i === 21) continue; // Skip your number
    users.push({
      name: `Siswa TJKT 2 Absen ${i}`,
      username: `siswa.tjkt2.${i}`,
      password: password,
      role: 'USER',
      class_id: tjkt2.id,
      absent_no: i,
      is_unlocked: false
    });
  }

  const { error: insertError } = await supabase.from('users').insert(users);

  if (insertError) {
    console.error('Error inserting users:', insertError);
  } else {
    console.log('Successfully repopulated TJKT 2 with 36 students (including you).');
  }
}

fixTJKT2();
