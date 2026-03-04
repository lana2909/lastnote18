
import { supabaseServer } from '@/lib/supabase';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

async function verifySpecificUser() {
  const supabase = supabaseServer();
  const username = 'admin.pplg1';
  const password = '12345678';
  
  console.log(`Checking user: ${username}`);

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, username, password, role, class_id, class:classes(id, name)')
    .eq('username', username)
    .single();

  if (error || !user) {
    console.error('User not found:', error);
    return;
  }

  const userWithClass = user as any;
  const dbClassId = user.class_id;
  const dbClassName = userWithClass.class?.name;

  console.log('User Details:', {
    id: user.id,
    role: user.role,
    class_id: dbClassId,
    class_name: dbClassName
  });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log(`Password '${password}' valid: ${isPasswordValid}`);

  // Simulate Logic from authOptions
  console.log('\n--- Simulating Login Logic ---');
  
  // Scenario 1: User selects CORRECT Class
  const selectedClassIdCorrect = dbClassId;
  console.log(`Attempting login with Class ID: ${selectedClassIdCorrect} (Correct)`);
  
  if (dbClassId && selectedClassIdCorrect) {
    if (dbClassId !== selectedClassIdCorrect) {
      console.log('❌ Login Failed: Class mismatch');
    } else {
      console.log('✅ Login Success: Class matches');
    }
  }

  // Scenario 2: User selects WRONG Class (e.g. random ID)
  const selectedClassIdWrong = 'some-random-id';
  console.log(`Attempting login with Class ID: ${selectedClassIdWrong} (Wrong)`);
  
  if (dbClassId && selectedClassIdWrong) {
    if (dbClassId !== selectedClassIdWrong) {
      console.log('❌ Login Failed: Class mismatch (Expected)');
    } else {
      console.log('✅ Login Success: Class matches');
    }
  }
}

verifySpecificUser();
