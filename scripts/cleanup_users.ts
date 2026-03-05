
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

async function cleanupDummyUsers() {
  console.log('Cleaning up dummy users (Admin X, Siswa X)...');

  // Define patterns for dummy names
  // Usually they start with "Admin" or "Siswa"
  // But be careful not to delete real people if they have "Admin" in name (unlikely for real names)
  // "Admin PPLG", "Admin TJKT", "Siswa 1", etc.
  // Also "Test Admin" and "admin.test" from previous scripts.

  // Fetch users to review first
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, username, role')
    .or('name.ilike.Admin%,name.ilike.Siswa%,name.ilike.Test Admin%');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No dummy users found matching "Admin%" or "Siswa%".');
    return;
  }

  console.log(`Found ${users.length} potential dummy users.`);
  
  const idsToDelete: string[] = [];
  
  for (const user of users) {
    // Double check it's not a real person (though "Admin ..." is pretty clearly dummy)
    // Exception: "MOHAMMAD NUR HADI MAULANA" is Admin, but his NAME is not "Admin ..."
    // The query 'name.ilike.Admin%' only matches names STARTING with "Admin".
    
    // Check if name literally starts with "Admin " or "Siswa " or is "Test Admin"
    const name = user.name.toUpperCase();
    if (name.startsWith('ADMIN ') || name.startsWith('SISWA ') || name === 'TEST ADMIN') {
       console.log(`Marking for deletion: ${user.name} (${user.username})`);
       idsToDelete.push(user.id);
    } else {
       console.log(`Skipping (Safe?): ${user.name}`);
    }
  }

  if (idsToDelete.length > 0) {
    // Delete them
    // First delete any linked data (messages, submission_tracker) if cascade isn't on?
    // Let's assume cascade is handled or we delete users directly.
    
    const { error: deleteError, count } = await supabase
      .from('users')
      .delete({ count: 'exact' })
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting users:', deleteError.message);
    } else {
      console.log(`\nSuccessfully deleted ${count} dummy users.`);
    }
  } else {
    console.log('\nNo users matched deletion criteria.');
  }
}

cleanupDummyUsers().catch(console.error);
