
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // 1. Find user by claim_token
    // Note: 'claim_token' column must exist in 'users' table.
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, name, username, email')
      .eq('claim_token', token)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    // 2. Generate new random password
    // Generate a secure random password (8 chars: 2 upper, 2 lower, 2 number, 2 special? Or just random hex)
    // Let's use a friendly but secure password format: Word-Word-Number or just random string
    // Simple random string is better for security, user can change it later.
    const newPassword = crypto.randomBytes(4).toString('hex'); // 8 chars hex

    // 3. Hash the password
    const hashedPassword = await hash(newPassword, 12);

    // 4. Update user: Set new password, CLEAR token (burn it)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        claim_token: null, // Burn the token
        is_unlocked: true, // Auto-unlock account if needed? Maybe not, keep game logic separate.
        // verified_at: new Date().toISOString() // If we had this column
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user credentials:', updateError);
      return NextResponse.json({ error: 'Failed to activate account' }, { status: 500 });
    }

    // 5. Return credentials
    return NextResponse.json({
      name: user.name,
      username: user.username,
      password: newPassword, // Plain text, shown ONCE
    });

  } catch (error: any) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
