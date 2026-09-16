import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', {
      status: 401,
    });
  }

  try {
    const pemilik = await query<{
      nama: string;
      jumlah_bidang: number;
    }>(`
      SELECT
        TRIM(nama_milik) AS nama,
        COUNT(*)::int AS jumlah_bidang
      FROM public.bidang_tanah
      WHERE NULLIF(TRIM(nama_milik), '') IS NOT NULL
      GROUP BY TRIM(nama_milik)
      ORDER BY nama ASC
    `);

    return NextResponse.json(pemilik, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });

  } catch (error) {
    console.error(
      'GET /api/analisis/kepemilikan/pemilik ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
