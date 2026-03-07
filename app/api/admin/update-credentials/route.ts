
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { classId, force } = await req.json();

    if (!classId) {
      return new NextResponse('Class ID required', { status: 400 });
    }

    const supabase = supabaseServer();

    // Fetch users who need tokens
    // If force is true, update everyone. If false, only those with NULL tokens.
    let query = supabase.from('users').select('id, name').eq('class_id', classId);
    
    if (!force) {
      query = query.is('claim_token', null);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users needed updates.', count: 0 });
    }

    let updatedCount = 0;

    // Update each user with a new token
    for (const user of users) {
      const token = crypto.randomBytes(32).toString('hex');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ claim_token: token })
        .eq('id', user.id);

      if (!updateError) {
        updatedCount++;
      } else {
        console.error(`Failed to update token for ${user.name}:`, updateError);
      }
    }

    return NextResponse.json({ 
      message: `Successfully generated credentials for ${updatedCount} students.`,
      count: updatedCount 
    });

  } catch (error: any) {
    console.error('Update Credentials error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
