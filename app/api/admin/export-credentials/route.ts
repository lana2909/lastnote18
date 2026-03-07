
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username || !['ADMINISTRATOR', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { classId } = await req.json();

    if (!classId) {
      return new NextResponse('Class ID required', { status: 400 });
    }

    const supabase = supabaseServer();

    // Fetch users
    const { data: users, error } = await supabase
      .from('users')
      .select('absent_no, name, username, claim_token, email')
      .eq('class_id', classId)
      .order('absent_no', { ascending: true, nullsFirst: false })
      .order('name');

    if (error) {
      throw error;
    }

    // Prepare data for Excel
    const exportData = users.map(u => ({
      'No': u.absent_no || '-',
      'Name': u.name,
      'Username': u.username,
      'Email': u.email || '-',
      'Claim Link': u.claim_token ? `${process.env.NEXTAUTH_URL}/claim/${u.claim_token}` : 'Not Generated',
      'Status': u.claim_token ? 'Ready to Claim' : 'Active/Claimed'
    }));

    // Create Workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credentials");

    // Generate Buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Credentials_Export_${new Date().getTime()}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
