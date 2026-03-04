
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMINISTRATOR') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { classId } = await req.json();
    const supabase = supabaseServer();

    // Update the user's view_as_class_id
    // If classId is null/undefined, it means "Reset to own class" (or show all? user said "pindah-pindah kelas", implying selecting one)
    // If we want to "reset", we can set it to null.
    
    const { error } = await supabase
      .from('users')
      .update({ view_as_class_id: classId || null })
      .eq('id', session.user.id);

    if (error) {
      console.error('Supabase Error:', error);
      return new NextResponse('Error switching class', { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
