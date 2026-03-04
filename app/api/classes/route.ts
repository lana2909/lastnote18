
import { supabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, name, display_name, theme_id')
      .order('name');

    if (error) {
      return new NextResponse('Error fetching classes', { status: 500 });
    }

    return NextResponse.json(classes);
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
