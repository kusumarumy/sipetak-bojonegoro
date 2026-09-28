import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

const LAYER_FILES: Record<string, string> = {
  traseg: 'traseg.geojson',
  sawah: 'sawah.geojson',
  hutan: 'hutan.geojson',
  pemukiman: 'pemukiman.geojson',
  pemakaman: 'pemakaman.geojson',
  kontur_traseg: 'kontur_traseg.geojson',
  sungai: 'sungai.geojson',
  rel_kereta: 'rel_kereta.geojson',
  jalan: 'jalan.geojson',
  kabel_sutet: 'kabel_sutet.geojson',
  tiang_sutet: 'tiang_sutet.geojson',
  pipa_exxon: 'pipa_exxon.geojson',
  pipa_gresem: 'pipa_gresem.geojson',
};

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/wgs84';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nama: string }> }
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', {
      status: 401,
    });
  }

  const { nama } = await params;

  try {

    // =====================================================
    // BANGUNAN
    // Ambil langsung dari Supabase / PostGIS
    // =====================================================

    if (nama === 'bangunan') {

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
                b.fid,

                'geometry',
                CASE
                  WHEN b.geometry IS NOT NULL
                  THEN ST_AsGeoJSON(b.geometry, 6)::json
                  ELSE NULL
                END,

                'properties',
                jsonb_build_object(
                  'fid',
                  b.fid,

                  'id',
                  b.id,

                  'jenis_bgn',
                  b.jenis_bgn,

                  'fungsi_bgn',
                  b.fungsi_bgn,

                  'jml_bgn',
                  b.jml_bgn,

                  'jml_lnt',
                  b.jml_lnt,

                  'luas_bgn',
                  b.luas_bgn,

                  'alamat_bgn',
                  b.alamat_bgn,

                  'update',
                  b.update,

                  'date_updt',
                  b.date_updt,

                  'foto_bgn',
                  b.foto_bgn
                )
              )
            ),
            '[]'::json
          )
        ) AS fc

        FROM public.bangunan b

        WHERE b.geometry IS NOT NULL
      `);

      return NextResponse.json(row.fc, {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      });
    }


    // =====================================================
    // LAYER LAIN
    // Tetap ambil dari GitHub
    // =====================================================

    const file = LAYER_FILES[nama];

    if (!file) {
      return new NextResponse('Layer tidak dikenal', {
        status: 404,
      });
    }

    const url = `${GITHUB_RAW_BASE}/${file}`;

    const response = await fetch(url, {
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      console.error(
        `GeoJSON "${nama}" gagal diambil:`,
        response.status,
        url
      );

      return new NextResponse(
        `GeoJSON layer "${file}" tidak ditemukan`,
        {
          status: 404,
        }
      );
    }

    const geojson = await response.json();

    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {

    console.error(
      `Gagal mengambil layer ${nama}:`,
      error
    );

    return NextResponse.json(
      {
        pesan: `Gagal mengambil layer "${nama}"`,
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
