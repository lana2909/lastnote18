
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = supabaseServer();

    // Fetch all 'momen_berkesan' from messages table
    // Since we want this to be a "public wall" on the dashboard, we fetch them anonymously
    const { data: memories, error } = await supabase
      .from('messages')
      .select('id, momen_berkesan, created_at')
      .not('momen_berkesan', 'is', null) // Filter out nulls
      .not('momen_berkesan', 'eq', '') // Filter out empty strings
      .order('created_at', { ascending: false })
      .limit(50); // Limit to latest 50 to avoid overload

    if (error) {
      console.error('Fetch public memories error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch memories' },
        { status: 500 }
      );
    }

    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Public memories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
