
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

async function deleteDummyData() {
  console.log('Deleting dummy messages for Keyshafana and Dicky...');

  // Identify the dummy messages by content or recipient
  // I created them with specific content earlier
  const { error: deleteError, count } = await supabase
    .from('messages')
    .delete({ count: 'exact' })
    .or('momen_berkesan.ilike.%Test Message for Keyshafana%,momen_berkesan.ilike.%Test Message for Dicky%');

  if (deleteError) {
    console.error('Error deleting messages:', deleteError.message);
  } else {
    console.log(`Deleted ${count} dummy messages.`);
  }
  
  // Also clean up submission_tracker for these if needed?
  // Foreign key cascade usually handles it, or we leave tracker?
  // If tracker remains, it says "Sent" but message is gone (404).
  // Better to delete tracker entries too if they exist without message.
  
  // Actually, delete messages first. Tracker links to message_id. 
  // If cascade delete is ON, tracker goes away.
  // If not, we should find orphaned trackers.
  
  const { data: orphanedTrackers } = await supabase
    .from('submission_tracker')
    .select('id, message_id');
    
  // We can't easily check foreign key existence in one query without join.
  // Let's just assume cascade or ignore for now, the UI handles missing messages gracefully (404 dialog).
  // But to be clean, let's remove trackers for Keysha/Dicky from Admin.
  
  // Get Admin ID
  const { data: admin } = await supabase.from('users').select('id').ilike('name', '%Mohammad Nur Hadi Maulana%').single();
  // Get Recipient IDs
  const { data: recipients } = await supabase.from('users').select('id').or('name.ilike.%Keyshafana%,name.ilike.%Dicky Darmawan%');
  
  if (admin && recipients) {
      const recipientIds = recipients.map(r => r.id);
      const { error: trackerError, count: trackerCount } = await supabase
          .from('submission_tracker')
          .delete({ count: 'exact' })
          .eq('user_id', admin.id)
          .in('recipient_id', recipientIds);
          
      console.log(`Deleted ${trackerCount} trackers.`);
  }
}

deleteDummyData().catch(console.error);
