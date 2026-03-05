
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SPECIAL_ROLES: Record<string, { role: string; isSuperAdmin: boolean }> = {
  'MOHAMMAD NUR HADI MAULANA': { role: 'ADMINISTRATOR', isSuperAdmin: true },
  'AHMAD NAUFAL SATRIO': { role: 'EDITOR', isSuperAdmin: false },
  'MUHAMMAD AFDAL': { role: 'EDITOR', isSuperAdmin: false },
  'KEYSHAFANA AYODYA PUTRI DEWITYA': { role: 'AUTHOR', isSuperAdmin: false },
  'VIVI NUR HIDAYAH': { role: 'AUTHOR', isSuperAdmin: false },
};

async function fixRoles() {
  console.log('Starting role fix process...\n');

  // 1. Fetch all users
  const { data: users, error } = await supabase.from('users').select('id, name, role, is_super_admin');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users.length} users. Processing updates...`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    const nameUpper = user.name.toUpperCase().trim();
    let targetRole = 'SUBSCRIBER';
    let targetIsSuperAdmin = false;

    // Check if user is in special list
    if (SPECIAL_ROLES[nameUpper]) {
      targetRole = SPECIAL_ROLES[nameUpper].role;
      targetIsSuperAdmin = SPECIAL_ROLES[nameUpper].isSuperAdmin;
    }

    // Check if update is needed
    if (user.role !== targetRole || user.is_super_admin !== targetIsSuperAdmin) {
      console.log(`Updating ${user.name}: ${user.role} -> ${targetRole}`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: targetRole, is_super_admin: targetIsSuperAdmin })
        .eq('id', user.id);

      if (updateError) {
        console.error(`  Failed to update ${user.name}:`, updateError.message);
      } else {
        updatedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\nRole fix completed!');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (Already correct): ${skippedCount}`);
  console.log('Total checked:', users.length);
}

fixRoles().catch((error) => {
  console.error('Fix roles failed:', error);
  process.exit(1);
});
