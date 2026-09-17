import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const LAYER_FILES: Record<string, string> = {
  traseg: 'traseg.geojson',
  sawah: 'sawah.geojson',
  hutan: 'hutan.geojson',
  pemukiman: 'pemukiman.geojson',
  pemakaman: 'pemakaman.geojson',
  sungai: 'sungai.geojson',
  rel_kereta: 'rel_kereta.geojson',
  jalan: 'jalan.geojson',
  kabel_sutet: 'kabel_sutet.geojson',
  tiang_sutet: 'tiang_sutet.geojson',
  pipa_exxon: 'pipa_exxon.geojson',
  pipa_gresem: 'pipa_gresem.geojson',
};

const KONTUR_FILES: Record<string, string> = {
  kontur_trase: 'kontur/kontur_trase.geojson',
  kontur_kawasan: 'kontur/kontur_kawasan.geojson',
};

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/wgs84';

const R2_PUBLIC_BASE = process.env.BOJO_R2_PUBLIC_BASE_URL;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nama: string }> }
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', { status: 401 });
  }

  const { nama } = await params;

  try {
    let url: string;
    let file: string;

    // =========================
    // LAYER DARI GITHUB
    // =========================
    if (LAYER_FILES[nama]) {
      file = LAYER_FILES[nama];
      url = `${GITHUB_RAW_BASE}/${file}`;
    }

    // =========================
    // KONTUR DARI CLOUDFLARE R2
    // =========================
    else if (KONTUR_FILES[nama]) {
      file = KONTUR_FILES[nama];

      if (!R2_PUBLIC_BASE) {
        console.error('BOJO_R2_PUBLIC_BASE_URL belum diatur');
        return new NextResponse(
          'URL publik Cloudflare R2 belum dikonfigurasi',
          { status: 500 }
        );
      }

      url = `${R2_PUBLIC_BASE.replace(/\/$/, '')}/${file}`;
    }

    // =========================
    // LAYER TIDAK DIKENAL
    // =========================
    else {
      return new NextResponse('Layer tidak dikenal', {
        status: 404,
      });
    }

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
