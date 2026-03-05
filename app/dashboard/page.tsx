
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const supabase = supabaseServer();
  const userClassId = session.user.classId;

  // 1. Fetch ALL Classmates (to calculate attendance number correctly)
  let query = supabase
    .from('users')
    .select('id, name')
    .order('name');

  if (userClassId) {
    query = query.eq('class_id', userClassId);
  }

  const { data: allClassmatesData } = await query;

  // 2. Fetch submission status
  const { data: submissions } = await supabase
    .from('submission_tracker')
    .select('recipient_id')
    .eq('user_id', session.user.id);

  const submittedIds = new Set(submissions?.map((s) => s.recipient_id) || []);

  // 3. Process data: Assign absent number first, THEN filter out self
  const classmates = allClassmatesData
    ?.map((user, index) => ({
      ...user,
      absentNumber: index + 1, // Assign absent number based on alphabetical order
      hasSent: submittedIds.has(user.id),
    }))
    .filter((user) => user.id !== session.user.id) || []; // Filter out self

  const totalSubmitted = submittedIds.size;
  // Total required is number of classmates (excluding self)
  const totalRequired = classmates.length; 

  return (
    <DashboardClient
      user={session.user}
      classmates={classmates}
      totalSubmitted={totalSubmitted}
      totalRequired={totalRequired}
    />
  );
}
