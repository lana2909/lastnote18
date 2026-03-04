import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const students = [
  // Super Admins
  { name: 'Mohammad Nur Hadi Maulana', role: 'ADMIN', isSuperAdmin: true },
  { name: 'Muhammad Afdal', role: 'ADMIN', isSuperAdmin: true },
  { name: 'Ahmad Naufal Satrio', role: 'ADMIN', isSuperAdmin: true },
  
  // Regular Admins
  { name: 'Vivi Nur Hidayah', role: 'ADMIN', isSuperAdmin: false },
  { name: 'Keyshafana Ayodya Putri Dewitya', role: 'ADMIN', isSuperAdmin: false },

  // Users (From the list provided)
  { name: 'Ahmad Fahri Syamsuri', role: 'USER' },
  { name: 'Alif Dafa Nur Rochman Suwandi', role: 'USER' },
  { name: 'Alvira Widya Putri', role: 'USER' },
  { name: 'Andi Tri Prasetyo', role: 'USER' },
  { name: 'Aqsha Panggaleh Ananda Mulia', role: 'USER' },
  { name: 'Beryl Aisha Malva', role: 'USER' },
  { name: 'Ceysha Valerina Renata', role: 'USER' },
  { name: 'Dicky Darmawan', role: 'USER' },
  { name: 'Ella Aprilia Bunga Dewi', role: 'USER' },
  { name: 'Faza Fauzan Adzima Arif Putra', role: 'USER' },
  { name: 'Feby Ayu Ariska', role: 'USER' },
  { name: 'Feri Juli Purwadinata', role: 'USER' },
  { name: 'Jonathan Shane Davis', role: 'USER' },
  { name: 'Karina', role: 'USER' },
  { name: 'Kirani Anastasya Putri', role: 'USER' },
  { name: 'Lucky Indhie Adriansyah', role: 'USER' },
  { name: 'Moch Catur Ramadhani', role: 'USER' },
  { name: 'Moch Saifudin Al Faris', role: 'USER' },
  { name: 'Muhammad Pradityo Putra', role: 'USER' },
  { name: 'Nur Asyifa Cahyandari Putri', role: 'USER' },
  { name: 'Putri Fira Lestari', role: 'USER' },
  { name: 'Rahma Krisnanda', role: 'USER' },
  { name: 'Raka Bintang Pratama', role: 'USER' },
  { name: 'Reynata Tsabita Putri', role: 'USER' },
  { name: 'Sadewo Aji Dewandaru', role: 'USER' },
  { name: 'Sherly Eka Meilinda', role: 'USER' },
  { name: 'Syafira Alya Miftakhul Jannah', role: 'USER' },
  { name: 'Vinkky Yanuarista Putri', role: 'USER' },
  { name: 'Vira Aulya', role: 'USER' },
  { name: 'Wahyuadi Putra Pramana', role: 'USER' },
  { name: 'Zahrotul Lita Anisa', role: 'USER' },
];

function generateUsername(name: string): string {
  const words = name.toLowerCase().split(' ');
  // Special handling for single names like 'Karina'
  if (words.length === 1) return words[0];
  return words.slice(0, 2).join('.');
}

function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function seed() {
  console.log('Starting seed process...\n');
  console.log('Cleaning up existing data...');
  // Delete all existing data
  
  const { error: deleteSettingsError } = await supabase.from('system_settings').delete().neq('key', 'generic_cleanup_key');
  if (deleteSettingsError) console.error('Error cleaning system_settings:', deleteSettingsError);

  const { error: deleteTrackerError } = await supabase.from('submission_tracker').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteTrackerError) console.error('Error cleaning submission_tracker:', deleteTrackerError);
  
  const { error: deleteMessagesError } = await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteMessagesError) console.error('Error cleaning messages:', deleteMessagesError);

  const { error: deleteUsersError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteUsersError) console.error('Error cleaning users:', deleteUsersError);

  console.log('Database cleaned.\n');

  console.log('='.repeat(80));
  console.log('ONE LAST NOTE - USER CREDENTIALS');
  console.log('='.repeat(80));
  console.log('');

  const credentials: Array<{ name: string; username: string; password: string; role: string }> = [];

  for (const student of students) {
    const username = generateUsername(student.name);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        name: student.name,
        username,
        password: hashedPassword,
        role: student.role,
        is_unlocked: false,
        is_super_admin: (student as any).isSuperAdmin || false,
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating user ${student.name}:`, error);
      continue;
    }

    credentials.push({
      name: student.name,
      username,
      password,
      role: student.role,
    });

    console.log(`${student.role === 'ADMIN' ? '[ADMIN]' : '[USER] '} ${student.name}`);
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log(`Successfully created ${credentials.length} users`);
  console.log(`Admins: ${credentials.filter(c => c.role === 'ADMIN').length}`);
  console.log(`Regular Users: ${credentials.filter(c => c.role === 'USER').length}`);
  console.log('='.repeat(80));
  console.log('\nSeed completed successfully!');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
