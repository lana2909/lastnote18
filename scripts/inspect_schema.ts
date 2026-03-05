
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

async function inspectSchema() {
  console.log('Inspecting DB Schema...');

  // Check 'messages' table columns by inserting a dummy row and seeing if it fails? 
  // Or better, just fetch one row if exists. If empty, we can't easily check columns without metadata table access.
  // But we can try to Select * limit 1.
  
  const { data, error } = await supabase.from('messages').select('*').limit(1);

  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  console.log('Messages Table Access: OK');
  
  if (data && data.length > 0) {
    console.log('Columns found in messages:', Object.keys(data[0]));
  } else {
    console.log('Messages table is empty. Trying to insert a dummy to check schema...');
    
    const dummy = {
      id: '00000000-0000-0000-0000-000000000001', // Temporary ID
      recipient_id: '00000000-0000-0000-0000-000000000000', // System user
      kesan: 'test',
      pesan: 'test',
      larangan: 'test',
      sifat: 'test',
      kesimpulan: 'test',
      hal_terpendam: 'test',
      momen_berkesan: 'test'
    };
    
    const { error: insertError } = await supabase.from('messages').insert(dummy);
    
    if (insertError) {
      console.error('Insert failed. Schema mismatch?', insertError.message);
    } else {
      console.log('Insert successful. Schema matches expected columns.');
      // Cleanup
      await supabase.from('messages').delete().eq('id', dummy.id);
    }
  }

  // Check submission_tracker
  const { error: trackerError } = await supabase.from('submission_tracker').select('*').limit(1);
  if (trackerError) console.error('Error fetching submission_tracker:', trackerError.message);
  else console.log('Submission Tracker Table Access: OK');

  // Check users
  const { error: usersError } = await supabase.from('users').select('*').limit(1);
  if (usersError) console.error('Error fetching users:', usersError.message);
  else console.log('Users Table Access: OK');
}

inspectSchema().catch(console.error);
