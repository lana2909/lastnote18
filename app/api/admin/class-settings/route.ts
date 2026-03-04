
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { classId, questions, unlockDate } = body;

    // Validate if the admin belongs to the class or is Super Admin
    if (!session.user.isSuperAdmin && session.user.classId !== classId) {
      return new NextResponse('Forbidden: You can only manage your own class', { status: 403 });
    }

    const supabase = supabaseServer();

    const { error } = await supabase
      .from('classes')
      .update({ 
        questions: questions,
        unlock_date: unlockDate 
      })
      .eq('id', classId);

    if (error) {
      console.error('Supabase Error:', error);
      return new NextResponse('Error updating class settings', { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
