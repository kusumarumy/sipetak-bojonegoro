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
    // CEK DATABASE YANG DIPAKAI VERCEL
    const info = await query(`
      SELECT
        current_database() AS database,
        current_schema() AS schema
    `);

    console.log('DB:', info);

    // CEK KOLOM TABEL bidang_tanah
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

                -- =========================
                -- IDENTITAS BIDANG
                -- =========================
                'id', f.id,
                'objectid', f.objectid,
                'bidang_id', f.bidang_id,
                'kodewilaya', f.kodewilaya,
                'kode_bid', f.kode_bid,
                'fid', f.fid,

                -- =========================
                -- WILAYAH
                -- =========================
                'kecamatan', f.kecamatan,
                'kelurahan', f.kelurahan,
                'rt_rw', f.rt_rw,

                -- =========================
                -- STATUS / ATRIBUT HAK
                -- =========================
                'tipehak', f.tipehak,
                'tipeproduk', f.tipeproduk,
                'tahun', f.tahun,
                'nib', f.nib,
                'sta_tnh', f.sta_tnh,
                'surat_hak', f.surat_hak,
                'nomor_hak', f.nomor_hak,
                'beban_hak', f.beban_hak,

                -- =========================
                -- PENGUKURAN / GEOMETRI
                -- =========================
                'luastertul', f.luastertul,
                'luaspeta', f.luaspeta,
                'sumbergeom', f.sumbergeom,
                'alatukur', f.alatukur,
                'metodukur', f.metodukur,
                'shape_leng', f.shape_leng,
                'shape_area', f.shape_area,
                'luas_tnh', f.luas_tnh,

                -- =========================
                -- TANAH
                -- =========================
                'penggunaan', f.penggunaan,
                'hub_tnh', f.hub_tnh,
                'kode_wwc', f.kode_wwc,
                'jenis_tnh', f.jenis_tnh,
                'ruang_atbt', f.ruang_atbt,
                'luas_atbt', f.luas_atbt,
                'dampak_tnh', f.dampak_tnh,

                -- =========================
                -- PEMILIK
                -- =========================
                'nama_milik', f.nama_milik,
                'ttl_milik', f.ttl_milik,
                'krja_milik', f.krja_milik,
                'almt_milik', f.almt_milik,
                'nik_milik', f.nik_milik,

                -- =========================
                -- PENYEWA
                -- =========================
                'nama_sewa', f.nama_sewa,
                'ttl_sewa', f.ttl_sewa,
                'krja_sewa', f.krja_sewa,
                'almt_sewa', f.almt_sewa,
                'nik_sewa', f.nik_sewa,

                -- =========================
                -- KONTAK
                -- =========================
                'nomor_hp', f.nomor_hp,

                -- =========================
                -- BANGUNAN
                -- =========================
                'jml_bgn', f.jml_bgn,

                -- =========================
                -- TANAMAN
                -- =========================
                'jenis_tnm', f.jenis_tnm,
                'jumlah_tnm', f.jumlah_tnm,

                -- =========================
                -- BENDA LAIN
                -- =========================
                'jenis_bnd', f.jenis_bnd,
                'jumlah_bnd', f.jumlah_bnd,

                -- =========================
                -- DATA / FILE
                -- =========================
                'date_updt', f.date_updt,
                'foto_tnh', f.foto_tnh,
                'nama', f.nama,
                'layer', f.layer,
                'path', f.path,

                -- =========================
                -- SISTEM
                -- =========================
                'created_at', f.created_at,
                'status', f.status
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
