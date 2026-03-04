import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipientId,
      userId,
      kesan,
      pesan,
      larangan,
      sifat,
      kesimpulan,
      halTerpendam,
      momenBerkesan,
    } = body;

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !recipientId ||
      !kesan ||
      !pesan ||
      !larangan ||
      !sifat ||
      !kesimpulan ||
      !halTerpendam ||
      !momenBerkesan
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    const { data: existingSubmission } = await supabase
      .from('submission_tracker')
      .select('id')
      .eq('user_id', userId)
      .eq('recipient_id', recipientId)
      .maybeSingle();

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already sent a message to this person' },
        { status: 400 }
      );
    }

    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        recipient_id: recipientId,
        kesan,
        pesan,
        larangan,
        sifat,
        kesimpulan,
        hal_terpendam: halTerpendam,
        momen_berkesan: momenBerkesan,
      })
      .select('id')
      .single();

    if (messageError) {
      console.error('Message insert error:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    const { error: trackerError } = await supabase
      .from('submission_tracker')
      .insert({
        user_id: userId,
        recipient_id: recipientId,
        message_id: messageData.id,
      });

    if (trackerError) {
      console.error('Tracker insert error:', trackerError);
      return NextResponse.json(
        { error: 'Failed to track submission' },
        { status: 500 }
      );
    }

    const { count } = await supabase
      .from('submission_tracker')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count && count >= 35) {
      await supabase
        .from('users')
        .update({ is_unlocked: true })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      isUnlocked: count && count >= 35,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
