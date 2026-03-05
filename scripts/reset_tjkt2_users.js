
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://qwirrmytmkyfssdlijgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXJybXl0bWt5ZnNzZGxpamdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc5NzE5NiwiZXhwIjoyMDg2MzczMTk2fQ.WFZLsJOGxTpnJ1CiSOtJ3BN9COhEG0YBVCrgdzUxWEg';

const supabase = createClient(supabaseUrl, supabaseKey);

const students = [
  "AHMAD FAHRI SYAMSURI",
  "AHMAD NAUFAL SATRIO",
  "ALIF DAFA NUR ROCHMAN SUWANDI",
  "ALVIRA WIDYA PUTRI",
  "ANDI TRI PRASETYO",
  "AQSHA PANGGALEH ANANDA M",
  "BERYL AISHA MALVA",
  "CEYSHA VALERINA RENATA",
  "DICKY DARMAWAN",
  "ELLA APRILIA BUNGA DEWI",
  "FAZA FAUZAN ADZIMA ARIF PUTRA",
  "FEBY AYU ARISKA",
  "FERI JULI PURWADINATA",
  "JONATHAN SHANE DAVIS",
  "KARINA",
  "KEYSHAFANA AYODYA PUTRI DEWITYA",
  "KIRANI ANASTASYA PUTRI",
  "LUCKY INDHIE ADRIANSYAH",
  "MOCH CATUR RAMADHANI",
  "MOCH SAIFUDIN AL FARIS",
  "MOHAMMAD NUR HADI MAULANA",
  "MUHAMMAD AFDAL",
  "MUHAMMAD PRADITYO PUTRA",
  "NUR ASYIFA CAHYANDARI PUTRI",
  "PUTRI FIRA LESTARI",
  "RAHMA KRISANDA",
  "RAKA BINTANG PRATAMA",
  "REYNATA TSABITA PUTRI",
  "SADEWO AJI DEWANDARU",
  "SHERLY EKA MEILINDA",
  "SYAFIRA ALYA MIFTAKHUL JANNAH",
  "VINKKY YANUARISTA PUTRI",
  "VIRA AULYA",
  "VIVI NUR HIDAYAH",
  "WAHYUADI PUTRA PRAMANA",
  "ZAHROTUL LITA ANISA"
];

function generateUsername(name) {
  const parts = name.toLowerCase().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[1]}`; // firstname.lastname
}

async function main() {
  console.log('--- RESETTING TJKT 2 (Preserving Users with Messages) ---');

  // 1. Find Class TJKT 2
  const { data: classes } = await supabase.from('classes').select('*');
  const tjkt2 = classes.find(c => c.name.includes('TJKT 2'));
  
  if (!tjkt2) {
    console.error('Class TJKT 2 not found!');
    return;
  }
  console.log(`Found Class: ${tjkt2.name} (${tjkt2.id})`);

  // 2. Identify Users with Messages (Sent or Received) to PRESERVE
  // We check 'messages' table for sender_id (user_id) or recipient_id
  
  // Note: user_id is the sender in 'messages' table usually? 
  // Let's check schema assumption: messages table has 'user_id' (sender) and 'recipient_id'.
  // Wait, in previous code: messages table has 'recipient_id'. Who is sender?
  // Usually 'user_id' or implicit. Let's check 'submission_tracker' too.
  
  // Let's protect specific users requested: "Kesyhafana sama Dicky" + "Mohammad Nur Hadi Maulana" (Admin)
  // And anyone who has data in 'messages' table just in case.
  
  const { data: messages } = await supabase.from('messages').select('recipient_id');
  const { data: submissions } = await supabase.from('submission_tracker').select('user_id');
  
  const protectedIds = new Set();
  
  // Add hardcoded protected names (to be safe)
  const protectedNames = [
    'KEYSHAFANA AYODYA PUTRI DEWITYA', 
    'DICKY DARMAWAN', 
    'MOHAMMAD NUR HADI MAULANA' // Admin must be protected!
  ];

  // Get IDs of protected names
  const { data: protectedUsers } = await supabase
    .from('users')
    .select('id, name')
    .in('name', protectedNames);
    
  protectedUsers?.forEach(u => protectedIds.add(u.id));
  
  // Add IDs from messages/submissions (Preserve data integrity)
  messages?.forEach(m => protectedIds.add(m.recipient_id));
  submissions?.forEach(s => protectedIds.add(s.user_id));

  console.log(`Protected User IDs (count: ${protectedIds.size})`);

  // 3. Delete UNPROTECTED Users in TJKT 2
  const { data: allTjkt2Users } = await supabase
    .from('users')
    .select('id, name')
    .eq('class_id', tjkt2.id);

  const toDelete = allTjkt2Users.filter(u => !protectedIds.has(u.id));
  
  console.log(`Users to delete: ${toDelete.length}`);
  if (toDelete.length > 0) {
    const idsToDelete = toDelete.map(u => u.id);
    const { error: delError } = await supabase
      .from('users')
      .delete()
      .in('id', idsToDelete);
      
    if (delError) console.error('Error deleting:', delError);
    else console.log('Deleted unprotected users.');
  }

  // 4. Recreate/Ensure All Users Exist
  const defaultPassword = await bcrypt.hash('123456', 10);
  
  for (const name of students) {
    const username = generateUsername(name);
    
    // Check if exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, role')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      console.log(`[SKIP] Exists: ${name}`);
      // Ensure role is correct (update if needed)
      let role = 'SUBSCRIBER';
      let isSuperAdmin = false;

      if (name === 'MOHAMMAD NUR HADI MAULANA') {
        role = 'ADMINISTRATOR'; isSuperAdmin = true;
      } else if (name === 'AHMAD NAUFAL SATRIO' || name === 'MUHAMMAD AFDAL') {
        role = 'EDITOR';
      } else if (name === 'KEYSHAFANA AYODYA PUTRI DEWITYA' || name === 'VIVI NUR HIDAYAH') {
        role = 'AUTHOR';
      }

      if (existing.role !== role) {
         console.log(`  -> Updating role to ${role}`);
         await supabase.from('users').update({ role, is_super_admin: isSuperAdmin }).eq('id', existing.id);
      }

    } else {
      console.log(`[CREATE] Creating: ${name}`);
      
      let role = 'SUBSCRIBER';
      let isSuperAdmin = false;

      if (name === 'MOHAMMAD NUR HADI MAULANA') {
        role = 'ADMINISTRATOR'; isSuperAdmin = true;
      } else if (name === 'AHMAD NAUFAL SATRIO' || name === 'MUHAMMAD AFDAL') {
        role = 'EDITOR';
      } else if (name === 'KEYSHAFANA AYODYA PUTRI DEWITYA' || name === 'VIVI NUR HIDAYAH') {
        role = 'AUTHOR';
      }

      const { error: createError } = await supabase
        .from('users')
        .insert({
          name: name,
          username: username,
          password: defaultPassword,
          role: role,
          class_id: tjkt2.id,
          is_super_admin: isSuperAdmin,
          is_unlocked: false
        });
        
      if (createError) console.error(`  -> Failed: ${createError.message}`);
    }
  }

  console.log('--- DONE ---');
}

main();
