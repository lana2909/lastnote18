
import { supabaseServer } from '@/lib/supabase';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

async function verifyLogin() {
  const supabase = supabaseServer();
  
  console.log('Searching for users...');

  // Search by username pattern
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, username, password, role, class_id')
    .eq('username', 'mohammad.nur');

  if (error) {
    console.error('Error finding users:', error);
    return;
  }

  // Fetch classes separately to avoid embedding issues
  const { data: classes } = await supabase.from('classes').select('id, name');
  const classMap = new Map(classes?.map(c => [c.id, c.name]));

  if (users && users.length > 0) {
    console.log(`Found ${users.length} users matching criteria:`);
    for (const u of users) {
      const className = u.class_id ? classMap.get(u.class_id) : 'None';
      console.log(`- [${u.role}] ${u.name} (@${u.username}) - Class: ${className}`);
      
      // Check password "MabarHayuk"
      const match = await bcrypt.compare('MabarHayuk', u.password);
      console.log(`  Password 'MabarHayuk' match: ${match}`);
    }
  } else {
    console.log('No users found matching mohammad.nur');
  }
}

verifyLogin();
