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
    // =========================================================
    // CEK DATABASE
    // =========================================================

    const info = await query(`
      SELECT
        current_database() AS database,
        current_schema() AS schema
    `);

    console.log('DB:', info);

    // =========================================================
    // CEK KOLOM bidang_tanah
    // =========================================================

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

    // =========================================================
    // AMBIL DATA BIDANG
    // =========================================================

    const [row] = await query<{ fc: any }>(`
      SELECT json_build_object(
        'type',
        'FeatureCollection',

        'features',
        COALESCE(
          json_agg(
            json_build_object(
              'type',
              'Feature',

              'id',
              f.id,

              'geometry',
              CASE
                WHEN f.geometry IS NOT NULL
                THEN ST_AsGeoJSON(f.geometry, 6)::json
                ELSE NULL
              END,

              'properties',

              -- =================================================
              -- IDENTITAS
              -- =================================================

              jsonb_build_object(
                'id', f.id,
                'objectid', f.objectid,
                'bidang_id', f.bidang_id,
                'kodewilaya', f.kodewilaya,
                'kode_bid', f.kode_bid,
                'fid', f.fid,
                'nib', f.nib
              )

              ||

              -- =================================================
              -- WILAYAH
              -- =================================================

              jsonb_build_object(
                'kecamatan', f.kecamatan,
                'kelurahan', f.kelurahan,
                'rt_rw', f.rt_rw
              )

              ||

              -- =================================================
              -- HAK / PRODUK
              -- =================================================

              jsonb_build_object(
                'tipehak', f.tipehak,
                'tipeproduk', f.tipeproduk,
                'tahun', f.tahun,
                'surat_hak', f.surat_hak,
                'nomor_hak', f.nomor_hak,
                'alas_hak', f.alas_hak,
                'beban_hak', f.beban_hak
              )

              ||

              -- =================================================
              -- LUAS
              -- =================================================

              jsonb_build_object(
                'luastertul', f.luastertul,
                'luaspeta', f.luaspeta,
                'luas_tnh', f.luas_tnh,
                'luas_atbt', f.luas_atbt,

                'luas_terdampak_m2',
                f.luas_terdampak_m2,

                'luas_sisa_m2',
                f.luas_sisa_m2,

                'sumbergeom', f.sumbergeom,
                'shape_leng', f.shape_leng,
                'shape_area', f.shape_area
              )

              ||

              -- =================================================
              -- PENGUKURAN
              -- =================================================

              jsonb_build_object(
                'alatukur', f.alatukur,
                'metodukur', f.metodukur
              )

              ||

              -- =================================================
              -- TANAH
              -- =================================================

              jsonb_build_object(
                'penggunaan', f.penggunaan,
                'hub_tnh', f.hub_tnh,
                'kode_wwc', f.kode_wwc,
                'jenis_tnh', f.jenis_tnh,
                'ruang_atbt', f.ruang_atbt,
                'sta_tnh', f.sta_tnh,
                'dampak_tnh', f.dampak_tnh
              )

              ||

              -- =================================================
              -- PEMILIK
              -- =================================================

              jsonb_build_object(
                'nama_milik', f.nama_milik,
                'ttl_milik', f.ttl_milik,
                'krja_milik', f.krja_milik,
                'almt_milik', f.almt_milik,
                'nik_milik', f.nik_milik,
                'nomor_hp', f.nomor_hp
              )

              ||

              -- =================================================
              -- PENYEWA
              -- =================================================

              jsonb_build_object(
                'nama_sewa', f.nama_sewa,
                'ttl_sewa', f.ttl_sewa,
                'krja_sewa', f.krja_sewa,
                'almt_sewa', f.almt_sewa,
                'nik_sewa', f.nik_sewa
              )

              ||

              -- =================================================
              -- BANGUNAN
              -- =================================================

              jsonb_build_object(
                'jml_bgn', f.jml_bgn
              )

              ||

              -- =================================================
              -- DATA LAIN
              -- =================================================

              jsonb_build_object(
                'date_updt', f.date_updt,
                'foto_tnh', f.foto_tnh,
                'nama', f.nama,
                'layer', f.layer,
                'path', f.path,
                'created_at', f.created_at
              )

              ||

              -- =================================================
              -- WORKFLOW PENDATAAN
              -- =================================================

              jsonb_build_object(
                'status', f.status,
                'catatan_supervisor', f.catatan_supervisor,
                'petugas_nama', f.petugas_nama,
                'tanggal_ukur', f.tanggal_ukur,
                'dikirim_pada', f.dikirim_pada,
                'diverifikasi_pada', f.diverifikasi_pada
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
