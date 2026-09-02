import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Layer GeoJSON statis yang diizinkan.
 * Data layer ini berada di GitHub, bukan di Supabase.
 */
const LAYER = new Set([
  'aoi_trace',
  'trace',
  'sawah',
  'hutan',
  'permukiman',
  'makam',
  'sungai',
  'rel_ka',
  'jalan',
  'sutet',
  'sutet_titik',
  'pipa_exxon',
  'pipa_gresik_semarang',
]);

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/kusumarumy/web_timorleste/main/public/data';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nama: string }> }
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', { status: 401 });
  }

  const { nama } = await params;

  // Pastikan hanya layer yang sudah kita izinkan yang dapat diminta
  if (!LAYER.has(nama)) {
    return new NextResponse('Layer tidak dikenal', { status: 404 });
  }

  const url = `${GITHUB_RAW_BASE}/${nama}.geojson`;

  try {
    const response = await fetch(url, {
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      return new NextResponse(
        `GeoJSON layer "${nama}" tidak ditemukan di GitHub`,
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