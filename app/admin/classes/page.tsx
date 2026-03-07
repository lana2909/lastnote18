
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';
import ClassManager from '@/components/admin/ClassManager';

export default async function ClassesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role === 'SUBSCRIBER') {
    redirect('/dashboard');
  }

  const supabase = supabaseServer();
  const userClassId = session.user.classId;

  // Check if user is one of the Super Admins by Name
  // "Untuk di Class Management yang bisa liat full cuma saya Mohammad Nur Hadi Maulana, Ahmad Naufal Satrio, dan Muhammad Afdal."
  const SUPER_ADMIN_NAMES = [
    'Mohammad Nur Hadi Maulana',
    'Ahmad Naufal Satrio',
    'Muhammad Afdal',
    'Test Admin', // Keep for testing
    'admin.test' // Keep for testing
  ];

  // Also check is_super_admin flag from DB just in case
  const { data: currentUser } = await supabase
    .from('users')
    .select('name, is_super_admin')
    .eq('id', session.user.id)
    .single();

  const isFullAccess = 
    currentUser?.is_super_admin || 
    SUPER_ADMIN_NAMES.includes(currentUser?.name || '');

  let majorsQuery = supabase
    .from('majors')
    .select(`
      *,
      classes:classes(*)
    `)
    .order('name');

  const { data: allMajors } = await majorsQuery;

  // Filter classes if not full access
  let filteredMajors = allMajors || [];

  if (!isFullAccess && userClassId) {
    // Only keep majors that contain the user's class
    // And inside that major, only keep the user's class
    filteredMajors = filteredMajors.reduce((acc: any[], major: any) => {
      const userClasses = major.classes.filter((c: any) => c.id === userClassId);
      if (userClasses.length > 0) {
        acc.push({
          ...major,
          classes: userClasses
        });
      }
      return acc;
    }, []);
  } else if (!isFullAccess && !userClassId) {
    // Admin without class and not super admin? Show nothing.
    filteredMajors = [];
  }

  return (
    <ClassManager 
      initialMajors={filteredMajors} 
      adminName={session.user.name}
      role={session.user.role}
    />
  );
}
