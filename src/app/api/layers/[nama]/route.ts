import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Mapping ID layer aplikasi → nama file GeoJSON di GitHub.
 */
const LAYER_FILES: Record<string, string> = {
  aoi_trace: 'aoi_trace.geojson',
  trace: 'trace.geojson',

  sawah: 'sawah.geojson',
  hutan: 'hutan.geojson',
  permukiman: 'pemukiman.geojson',
  makam: 'pemakaman.geojson',

  sungai: 'sungai.geojson',
  rel_ka: 'rel_kereta.geojson',
  jalan: 'jalan.geojson',

  sutet: 'kabel_sutet.geojson',
  sutet_titik: 'tiang_sutet.geojson',

  pipa_exxon: 'pipa_exxon.geojson',
  pipa_gresik_semarang: 'pipa_gresik_semarang.geojson',
};

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/wgs84';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nama: string }> }
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', { status: 401 });
  }

  const { nama } = await params;

  // Pastikan layer memang terdaftar
  const file = LAYER_FILES[nama];

  if (!file) {
    return new NextResponse('Layer tidak dikenal', { status: 404 });
  }

  const url = `${GITHUB_RAW_BASE}/${file}`;

  try {
    const response = await fetch(url, {
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      return new NextResponse(
        `GeoJSON layer "${file}" tidak ditemukan di GitHub`,
        { status: 404 }
      );
    }

    const geojson = await response.json();

    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error(`Gagal mengambil layer ${nama}:`, error);

    return new NextResponse(
      `Gagal mengambil GeoJSON layer "${nama}"`,
      { status: 500 }
    );
  }
}
