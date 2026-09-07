import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', { status: 401 });
  }

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

              'nib', f.nib,

              'luas_m2', f.luastertul,

              'penggunaan', f.penggunaan,

              'bangunan', f.jml_bgn,

              'tipehak', f.tipehak,
              'tipeproduk', f.tipeproduk,
              'tahun', f.tahun,

              'rt_rw', f.rt_rw,
              'nama_sewa', f.nama_sewa,

              'sta_tnh', f.sta_tnh,
              'surat_hak', f.surat_hak,
              'nomor_hak', f.nomor_hak,

              'luas_tnh', f.luas_tnh,
              'ruang_atbt', f.ruang_atbt,
              'luas_atbt', f.luas_atbt,

              'jenis_tnm', f.jenis_tnm,
              'jumlah_tnm', f.jumlah_tnm,

              'jenis_bnd', f.jenis_bnd,
              'jumlah_bnd', f.jumlah_bnd,

              'dampak_tnh', f.dampak_tnh,

              'nomor_hp', f.nomor_hp,

              'foto_tnh', f.foto_tnh
            )
          )
        ),
        '[]'::json
      )
    ) AS fc
    FROM public.bidang_tanah f
  `);

  return NextResponse.json(row.fc, {
    headers: {
      'Cache-Control': 'private, max-age=15',
    },
  });
}
