
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
  console.log('--- Restoring TJKT 2 Students ---');

  // 1. Find Class TJKT 2
  const { data: classes } = await supabase.from('classes').select('*');
  const tjkt2 = classes.find(c => c.name.includes('TJKT 2'));
  
  if (!tjkt2) {
    console.error('Class TJKT 2 not found!');
    return;
  }
  console.log(`Found Class: ${tjkt2.name} (${tjkt2.id})`);

  // 2. Clear existing dummy users in TJKT 2 (Optional: only remove "Siswa TJKT 2 Absen X")
  console.log('Cleaning up dummy users...');
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('class_id', tjkt2.id)
    .ilike('name', 'Siswa TJKT 2%'); // Only delete dummy names

  if (deleteError) console.error('Error deleting dummies:', deleteError);

  // 3. Process Student List
  const defaultPassword = await bcrypt.hash('123456', 10);
  
  for (const name of students) {
    const username = generateUsername(name);
    
    // Check if user already exists (to preserve password)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      console.log(`[SKIP] User already exists: ${existingUser.name} (${username}) - Password preserved.`);
      
      // Ensure they are in the right class just in case
      await supabase
        .from('users')
        .update({ class_id: tjkt2.id })
        .eq('id', existingUser.id);
        
    } else {
      console.log(`[CREATE] Creating new user: ${name} (${username})`);
      
      // Determine Role
      let role = 'SUBSCRIBER';
      let isSuperAdmin = false;

      // Restore specific roles
      if (name === 'MOHAMMAD NUR HADI MAULANA') {
        role = 'ADMINISTRATOR';
        isSuperAdmin = true;
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
          password: defaultPassword, // New users get default password
          role: role,
          class_id: tjkt2.id,
          is_super_admin: isSuperAdmin,
          is_unlocked: false
        });

      if (createError) {
        console.error(`Error creating ${name}:`, createError.message);
      }
    }
  }
  
  console.log('--- Restoration Complete ---');
}

main();
