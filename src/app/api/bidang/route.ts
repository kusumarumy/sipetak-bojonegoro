import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/bidang — seluruh bidang sebagai GeoJSON untuk peta.
 *
 * 950 poligon berukuran beberapa MB, jadi disajikan sebagai satu GeoJSON, bukan
 * vector tile. Keuntungannya: hasil edit langsung tampil tanpa proses tiling
 * ulang. Layer statis yang berat (kontur, ortho, DTM) tetap lewat PMTiles.
 */
export async function GET() {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });

  const [row] = await query<{ fc: any }>(`
    SELECT json_build_object(
      'type','FeatureCollection',
      'features', COALESCE(json_agg(json_build_object(
        'type','Feature',
        'id', f.rn,
        'geometry', ST_AsGeoJSON(f.geom, 6)::json,
        'properties', json_build_object(
          'id', f.id, 'kode', f.kode, 'status', f.status,
          'penggunaan', f.penggunaan, 'desa', f.desa,
          'pemilik', f.pemilik, 'luas', f.luas_m2, 'kena', f.luas_terdampak_m2,
          'no', f.kode
        ))), '[]'::json)
    ) AS fc
    FROM (SELECT v.*, row_number() OVER (ORDER BY v.kode) AS rn FROM v_bidang_peta v) f
  `);

  return NextResponse.json(row.fc, {
    headers: { 'Cache-Control': 'private, max-age=15' }
  });
}
