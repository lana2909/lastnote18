
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

async function restoreDummyData() {
  console.log('Restoring dummy data for testing...');

  // 1. Get Admin User (Sender)
  const { data: admin } = await supabase
    .from('users')
    .select('id, name')
    .ilike('name', '%Mohammad Nur Hadi Maulana%')
    .single();

  if (!admin) {
    console.error('Admin user not found!');
    return;
  }
  console.log(`Sender: ${admin.name} (${admin.id})`);

  // 2. Get Recipients (Keysha & Dicky)
  const { data: recipients } = await supabase
    .from('users')
    .select('id, name')
    .or('name.ilike.%Keyshafana%,name.ilike.%Dicky Darmawan%');

  if (!recipients || recipients.length === 0) {
    console.error('Recipients not found!');
    return;
  }

  console.log(`Found ${recipients.length} recipients.`);

  // 3. Create Messages
  for (const recipient of recipients) {
    console.log(`Creating message for ${recipient.name}...`);
    
    // Check if message already exists
    const { data: existing } = await supabase
      .from('submission_tracker')
      .select('id')
      .eq('user_id', admin.id)
      .eq('recipient_id', recipient.id)
      .maybeSingle();

    if (existing) {
      console.log('  Message already exists. Skipping.');
      continue;
    }

    // Insert Message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        recipient_id: recipient.id,
        kesan: 'Ini adalah pesan dummy untuk testing. Kesan saya sangat baik.',
        pesan: 'Semoga sukses selalu kedepannya!',
        larangan: 'Jangan lupa makan.',
        sifat: 'Rajin dan ceria.',
        kesimpulan: 'Teman yang baik.',
        hal_terpendam: 'Sebenarnya saya ingin bilang terima kasih.',
        momen_berkesan: `Momen saat kita belajar coding bersama. (Test Message for ${recipient.name})`
      })
      .select()
      .single();

    if (msgError) {
      console.error('  Error creating message:', msgError.message);
      continue;
    }

    // Insert Tracker
    const { error: trackError } = await supabase
      .from('submission_tracker')
      .insert({
        user_id: admin.id,
        recipient_id: recipient.id,
        message_id: message.id
      });

    if (trackError) {
      console.error('  Error creating tracker:', trackError.message);
    } else {
      console.log('  Success!');
    }
  }

  console.log('\nDummy data restoration completed.');
}

restoreDummyData().catch(console.error);
