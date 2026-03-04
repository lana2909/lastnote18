
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

    const { searchParams } = new URL(req.url);
    const recipientId = searchParams.get('recipientId');

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // Fetch the message linked to the tracker
    const { data: tracker } = await supabase
      .from('submission_tracker')
      .select('message_id, messages(*)')
      .eq('user_id', session.user.id)
      .eq('recipient_id', recipientId)
      .maybeSingle();

    if (!tracker) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (!tracker.messages) {
      return NextResponse.json(
        { error: 'Message content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: tracker.messages });
  } catch (error) {
    console.error('Get sent message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
