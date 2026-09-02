import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

/** Layer statis yang diizinkan. Daftar putih supaya nama layer tidak bisa dikarang. */
const LAYER = new Set([
  'aoi_trace', 'trace', 'sawah', 'hutan', 'permukiman', 'makam',
  'sungai', 'rel_ka', 'jalan', 'sutet', 'sutet_titik', 'pipa_exxon', 'pipa_gresik_semarang'
]);

export async function GET(_req: Request, { params }: { params: Promise<{ nama: string }> }) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });
  const { nama } = await params;
  if (!LAYER.has(nama)) return new NextResponse('Layer tidak dikenal', { status: 404 });

  const [row] = await query<{ fc: any }>(`
    SELECT json_build_object(
      'type','FeatureCollection',
      'features', COALESCE(json_agg(json_build_object(
        'type','Feature',
        'geometry', ST_AsGeoJSON(geom, 6)::json,
        'properties', props || jsonb_build_object('nama', nama))), '[]'::json)
    ) AS fc FROM layer_geom WHERE layer = $1`, [nama]);

  return NextResponse.json(row.fc, {
    headers: { 'Cache-Control': 'private, max-age=3600' }   // layer statis, jarang berubah
  });
}
