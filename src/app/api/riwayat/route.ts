import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Gagal mengambil audit_log:', error);

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error API riwayat:', error);

    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat mengambil riwayat aksi',
      },
      { status: 500 }
    );
  }
}
