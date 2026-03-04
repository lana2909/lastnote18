
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

  // 1. Fetch Classmates (Users in the same class, excluding self)
  // If user has no class (e.g. super admin), maybe show all or none. 
  // Let's assume standard users have classId.
  let query = supabase
    .from('users')
    .select('id, name')
    .neq('id', session.user.id)
    .order('name');

  if (userClassId) {
    query = query.eq('class_id', userClassId);
  }

  const { data: classmatesData } = await query;

  // 2. Fetch submission status
  const { data: submissions } = await supabase
    .from('submission_tracker')
    .select('recipient_id')
    .eq('user_id', session.user.id);

  const submittedIds = new Set(submissions?.map((s) => s.recipient_id) || []);

  const classmates = classmatesData?.map((user) => ({
    ...user,
    hasSent: submittedIds.has(user.id),
  })) || [];

  const totalSubmitted = submittedIds.size;
  // Total required is number of classmates (excluding self)
  // Or hardcoded 35 as requested? 
  // "Pokok tiap kelas total itu 36 sama diri sendiri. Ingat jangan dimasukin juga diri sendiri, jadi dilist nanti itu 35 orang yang harus dikirimi pesan"
  // Let's use the actual count of classmates found in DB to be dynamic and accurate, 
  // but if you strictly want 35, we can use 35. 
  // However, dynamic is better to avoid bugs if a class has 34 or 37 students.
  // But user said "Pokok tiap kelas total itu 36", so let's stick to dynamic length of classmates array.
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
