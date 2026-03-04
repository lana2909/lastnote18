
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer();
    const userClassId = session.user.classId;
    let unlockDate = null;

    if (userClassId) {
      // Fetch unlock date from class settings first
      const { data: cls } = await supabase
        .from('classes')
        .select('unlock_date')
        .eq('id', userClassId)
        .single();
      
      if (cls && cls.unlock_date) {
        unlockDate = cls.unlock_date;
      }
    }

    // Fallback to system setting if no class specific date (or if user has no class)
    if (!unlockDate) {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'message_unlock_date')
        .single();
      
      unlockDate = data?.value || null;
    }

    return NextResponse.json({
      unlockDate: unlockDate,
      isSuperAdmin: session.user?.isSuperAdmin || false
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // This global setting endpoint is for Super Admin only
  // Class admins use /api/admin/class-settings
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer();
    
    const { data: user } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', session.user.id)
      .single();

    if (!user?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Only Super Admins can perform this action' }, { status: 403 });
    }

    const body = await req.json();
    const { unlockDate } = body;

    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'message_unlock_date',
        value: unlockDate,
        updated_by: session.user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
