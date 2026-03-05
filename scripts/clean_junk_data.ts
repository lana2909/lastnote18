
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

async function cleanJunkData() {
  console.log('Starting cleanup process...\n');

  // 1. Clean messages (Data dummy / Test messages)
  console.log('Cleaning messages table...');
  const { error: messagesError, count: messagesCount } = await supabase
    .from('messages')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep system record if any

  if (messagesError) {
    console.error('Error cleaning messages:', messagesError.message);
  } else {
    console.log(`Deleted ${messagesCount} messages.`);
  }

  // 2. Clean submission_tracker (Test submissions)
  console.log('Cleaning submission_tracker table...');
  const { error: trackerError, count: trackerCount } = await supabase
    .from('submission_tracker')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (trackerError) {
    console.error('Error cleaning submission_tracker:', trackerError.message);
  } else {
    console.log(`Deleted ${trackerCount} submission records.`);
  }

  // 3. Reset User Status (Optional - locks everyone again)
  console.log('Resetting user unlock status...');
  const { error: userError, count: userCount } = await supabase
    .from('users')
    .update({ is_unlocked: false })
    .neq('role', 'ADMIN') // Don't lock admins if that's a thing, or just reset everyone
    .neq('id', '00000000-0000-0000-0000-000000000000'); 
    
  if (userError) {
    console.error('Error resetting users:', userError.message);
  } else {
    console.log(`Reset status for ${userCount} users.`);
  }

  // 4. Clean system_settings (if needed, usually not "junk" but config, skipping for safety unless requested)
  // console.log('Cleaning system_settings...');
  // ...

  console.log('\nCleanup completed successfully!');
  console.log('Note: Users and Classes were PRESERVED. Only messages and submissions were deleted.');
}

cleanJunkData().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
