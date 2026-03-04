
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';
import AdminClient from '@/components/admin/AdminClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role;

  // SUBSCRIBER cannot access admin page
  if (role === 'SUBSCRIBER') {
    redirect('/dashboard');
  }

  const supabase = supabaseServer();
  const userClassId = session.user.classId;
  const originalClassId = session.user.originalClassId;

  // 1. Fetch Users
  let usersQuery = supabase
    .from('users')
    .select('id, name, class_id')
    .order('name');

  // 2. Fetch Messages
  let messagesQuery = supabase
    .from('messages')
    .select(`
      *,
      recipient:users!messages_recipient_id_fkey(id, name, class_id)
    `)
    .order('created_at', { ascending: false });

  // Apply Class Filter
  if (userClassId) {
    // Only show users from same class
    usersQuery = usersQuery.eq('class_id', userClassId);
  }

  const { data: allUsers } = await usersQuery;
  const { data: allMessages } = await messagesQuery;

  // Filter messages in memory
  let filteredMessages = allMessages || [];
  if (userClassId) {
    filteredMessages = filteredMessages.filter(
      (msg: any) => msg.recipient?.class_id === userClassId
    );
  }

  // 3. Fetch Class Settings (if applicable)
  let classSettings = undefined;
  if (userClassId) {
    const { data: cls } = await supabase
      .from('classes')
      .select('questions, unlock_date')
      .eq('id', userClassId)
      .single();
    
    if (cls) {
      classSettings = {
        questions: cls.questions || [],
        unlockDate: cls.unlock_date
      };
    }
  }

  // 4. Fetch All Classes (Only for ADMINISTRATOR to switch)
  let allClasses: { id: string; name: string }[] = [];
  if (role === 'ADMINISTRATOR') {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .order('name');
    allClasses = classes || [];
  }

  // Determine if user is viewing their own class (for editing settings)
  // AUTHOR always views own class.
  // ADMINISTRATOR views own class if userClassId == originalClassId.
  // EDITOR cannot edit settings anyway.
  const isOwnClass = role === 'AUTHOR' || (role === 'ADMINISTRATOR' && userClassId === originalClassId);

  return (
    <AdminClient
      users={allUsers || []}
      messages={filteredMessages}
      adminName={session.user.name}
      role={role}
      userClassId={userClassId}
      classSettings={classSettings}
      allClasses={allClasses}
      isOwnClass={isOwnClass}
    />
  );
}
