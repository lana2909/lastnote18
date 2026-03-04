
import dotenv from 'dotenv';
dotenv.config();

import { supabaseServer } from '../lib/supabase';

async function checkDataConsistency() {
  const supabase = supabaseServer();

  console.log('Checking Users and Classes consistency...');

  // 1. Get all users with class_id
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, class_id, role');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  // 2. Get all classes
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name');

  if (classesError) {
    console.error('Error fetching classes:', classesError);
    return;
  }

  const classMap = new Map(classes.map(c => [c.id, c.name]));

  console.log(`Found ${users.length} users and ${classes.length} classes.`);

  let mismatchCount = 0;
  users.forEach(user => {
    if (user.class_id) {
      if (!classMap.has(user.class_id)) {
        console.error(`[MISMATCH] User ${user.username} (Role: ${user.role}) has class_id ${user.class_id} which DOES NOT EXIST in classes table.`);
        mismatchCount++;
      } else {
        // console.log(`[OK] User ${user.username} is linked to class ${classMap.get(user.class_id)}`);
      }
    } else {
        if (user.role !== 'ADMINISTRATOR' && user.role !== 'EDITOR') {
             console.warn(`[WARNING] User ${user.username} (Role: ${user.role}) has NO class_id.`);
        }
    }
  });

  if (mismatchCount === 0) {
    console.log('All user class references are valid.');
  } else {
    console.error(`Found ${mismatchCount} users with invalid class references.`);
  }
}

checkDataConsistency();
