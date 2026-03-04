
import { supabaseServer } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedClassUsers() {
  const supabase = supabaseServer();
  const password = await bcrypt.hash('12345678', 10);

  // 1. Get all classes
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name, display_name');

  if (classError) {
    console.error('Error fetching classes:', classError);
    return;
  }

  if (!classes || classes.length === 0) {
    console.log('No classes found. Please run migration first.');
    return;
  }

  console.log(`Found ${classes.length} classes. Creating users...`);

  for (const cls of classes) {
    // Generate a clean identifier for the class (e.g., "PPLG 1" -> "pplg1")
    const classSlug = cls.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Create Users
    const usersToCreate = [
      {
        name: `Admin ${cls.name}`,
        username: `admin.${classSlug}`,
        password: password,
        role: 'ADMIN',
        class_id: cls.id,
        is_unlocked: true,
        is_super_admin: false
      },
      {
        name: `Admin 2 ${cls.name}`,
        username: `admin2.${classSlug}`,
        password: password,
        role: 'ADMIN',
        class_id: cls.id,
        is_unlocked: true,
        is_super_admin: false
      },
      {
        name: `Siswa Biasa ${cls.name}`,
        username: `siswa.${classSlug}`,
        password: password,
        role: 'USER',
        class_id: cls.id,
        is_unlocked: false, 
        is_super_admin: false,
        absent_no: 1
      }
    ];

    for (const user of usersToCreate) {
      const { error } = await supabase.from('users').upsert(user, { onConflict: 'username' });
      if (error) {
        console.error(`Failed to create ${user.username}:`, error.message);
      } else {
        console.log(`Created: ${user.username}`);
      }
    }
  }
}

seedClassUsers();
