
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

    for (const student of students) {
      try {
        const username = student.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '.')
          .replace(/\.+/g, '.')
          .replace(/^\.+|\.+$/g, '');

        // Check if username exists, append random number if so? 
        // For now, let's assume names are unique enough or let it fail and report.
        // Actually, better to append a suffix if exists, but that's complex in a loop.
        // Let's just try insert.

        const { error } = await supabase.from('users').insert({
          name: student.name,
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
                name: student.name,
                username: `${username}.${suffix}`,
                password: defaultPassword,
                role: 'USER',
                class_id: classId,
                absent_no: student.absentNo,
                is_unlocked: false,
             });
             
             if (retryError) {
               results.failed++;
               results.errors.push(`Failed to add ${student.name}: ${retryError.message}`);
             } else {
               results.success++;
             }
          } else {
            results.failed++;
            results.errors.push(`Failed to add ${student.name}: ${error.message}`);
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
