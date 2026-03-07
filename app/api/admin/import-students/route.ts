
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { classId, students } = await req.json();

    if (!classId || !students || !Array.isArray(students)) {
      return new NextResponse('Invalid data', { status: 400 });
    }

    const supabase = supabaseServer();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Default password hash
    const defaultPassword = await bcrypt.hash('12345678', 10);

    // Sort students by absentNo ascending to handle shifts correctly if multiple insertions
    // Actually, if we insert 26 then 27, it works. 
    // If we insert 27 then 26: 
    // Insert 27 (Shift 27+ -> 28+). 27 is now taken.
    // Insert 26 (Shift 26+ -> 27+). The new 27 (was 26) moves to 28. The 28 (was 27) moves to 29.
    // It seems safe regardless of order, but ascending is logical.
    students.sort((a: any, b: any) => (a.absentNo || 0) - (b.absentNo || 0));

    for (const student of students) {
      try {
        // Normalize name to UPPERCASE for consistency
        const normalizedName = student.name ? student.name.trim().toUpperCase() : 'UNKNOWN';

        // 1. Handle Absent Number Shifting (Make Room)
        if (student.absentNo) {
          // Find users who need to move
          const { data: conflicts } = await supabase
            .from('users')
            .select('id, absent_no')
            .eq('class_id', classId)
            .gte('absent_no', student.absentNo)
            .order('absent_no', { ascending: false }); // Move from back to front to avoid collision if unique constraint exists

          if (conflicts && conflicts.length > 0) {
            // Shift them one by one (safe for small class sizes)
            for (const u of conflicts) {
              await supabase
                .from('users')
                .update({ absent_no: u.absent_no + 1 })
                .eq('id', u.id);
            }
          }
        }

        const username = normalizedName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '.')
          .replace(/\.+/g, '.')
          .replace(/^\.+|\.+$/g, '');

        // Check if username exists, append random number if so? 
        // ... (rest of logic)

        const { error } = await supabase.from('users').insert({
          name: normalizedName,
          username: username,
          password: defaultPassword,
          role: 'USER',
          class_id: classId,
          absent_no: student.absentNo,
          is_unlocked: false,
        });

        if (error) {
          if (error.code === '23505') { // Unique violation
             // Try with a suffix
             const suffix = Math.floor(Math.random() * 1000);
             const { error: retryError } = await supabase.from('users').insert({
                name: normalizedName,
                username: `${username}.${suffix}`,
                password: defaultPassword,
                role: 'USER',
                class_id: classId,
                absent_no: student.absentNo,
                is_unlocked: false,
             });
             
             if (retryError) {
               results.failed++;
               results.errors.push(`Failed to add ${normalizedName}: ${retryError.message}`);
             } else {
               results.success++;
             }
          } else {
            results.failed++;
            results.errors.push(`Failed to add ${normalizedName}: ${error.message}`);
          }
        } else {
          results.success++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Exception for ${student.name}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      message: `Import complete. Success: ${results.success}, Failed: ${results.failed}`,
      details: results 
    });

  } catch (error) {
    console.error('[IMPORT_STUDENTS_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
