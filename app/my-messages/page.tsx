import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';
import MyMessagesClient from '@/components/messages/MyMessagesClient';

export default async function MyMessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!session.user.isUnlocked) {
    redirect('/dashboard');
  }

  const supabase = supabaseServer();

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('recipient_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <MyMessagesClient
      messages={messages || []}
      userName={session.user.name}
    />
  );
}
