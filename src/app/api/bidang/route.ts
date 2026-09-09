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
    // 🔍 CEK DATABASE YANG DIPAKAI VERCEL
    const info = await query(`
      SELECT
        current_database() AS database,
        current_schema() AS schema
    `);

    console.log('DB:', info);

    // 🔍 CEK KOLOM TABEL bidang_tanah
    const cek = await query(`
      SELECT
        column_name,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'bidang_tanah'
      ORDER BY ordinal_position
    `);

    console.log('KOLOM:', cek);
    
    const [row] = await query<{ fc: any }>(`
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features',
        COALESCE(
          json_agg(
            json_build_object(
              'type', 'Feature',
              'id', f.id,

              'geometry',
              CASE
                WHEN f.geometry IS NOT NULL
                THEN ST_AsGeoJSON(f.geometry, 6)::json
                ELSE NULL
              END,

              'properties',
              json_build_object(
                'id', f.id,

                'kode', f.kode_bid,
                'bidang_id', f.bidang_id,

                'status', f.status,

                'kecamatan', f.kecamatan,
                'desa', f.kelurahan,

                'pemilik', f.nama_milik,

                'luas_m2', f.luas_tnh,

                'luas_tnh', f.luas_tnh,
                'luastertul', f.luastertul,
                'luaspeta', f.luaspeta,

                'luas_atbt', f.luas_atbt,

                'penggunaan', f.penggunaan,

                'jml_bgn', f.jml_bgn,

                'ruang_atbt', f.ruang_atbt,
                'dampak_tnh', f.dampak_tnh,
              )
            )
          ),
          '[]'::json
        )
      ) AS fc

      FROM public.bidang_tanah f

      WHERE f.deleted_at IS NULL
    `);

    return NextResponse.json(row.fc, {
      headers: {
        'Cache-Control': 'private, max-age=15',
      },
    });

  } catch (error) {
    console.error(
      'GET /api/bidang ERROR:',
      error
    );

    return NextResponse.json(
      {
        pesan: 'Gagal memuat daftar bidang',
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
