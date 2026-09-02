import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { query, transaksi } from '@/lib/db';

const Skema = z.object({
  bidang_id: z.string().uuid(),
  kategori: z.string().min(3).max(40),
  object_key: z.string().min(5),
  nama_asli: z.string().max(200).optional(),
  mime: z.string().max(80).optional(),
  ukuran_byte: z.number().int().optional(),
  lat: z.number().min(-90).max(90).nullish(),
  lon: z.number().min(-180).max(180).nullish(),
  diambil_pada: z.string().nullish()
});

/**
 * Mencatat berkas yang sudah terunggah. Koordinat dan waktu diambil dari EXIF
 * di sisi klien — keduanya yang membuat foto bisa dipertanggungjawabkan bila
 * kelak ada sanggahan atas data bidang.
 */
export async function POST(req: Request) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });

  const parsed = Skema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse('Metadata tidak valid', { status: 400 });
  const d = parsed.data;

  const [row] = await transaksi(sesi.user.id, async (c) => {
    const r = await c.query(
      `INSERT INTO lampiran (bidang_id, kategori, object_key, nama_asli, mime, ukuran_byte,
                             lat, lon, diambil_pada, diunggah_oleh)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, sensitif`,
      [d.bidang_id, d.kategori, d.object_key, d.nama_asli ?? null, d.mime ?? null,
       d.ukuran_byte ?? null, d.lat ?? null, d.lon ?? null, d.diambil_pada ?? null, sesi.user.id]);
    return r.rows;
  });

  return NextResponse.json(row);
}

/** GET /api/lampiran?bidang_id=... — daftar berkas satu bidang. */
export async function GET(req: Request) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });
  const bidang_id = new URL(req.url).searchParams.get('bidang_id');
  if (!bidang_id) return new NextResponse('bidang_id wajib diisi', { status: 400 });

  const rows = await query(
    `SELECT id, kategori, nama_asli, mime, lat, lon, diambil_pada, sensitif, diunggah_pada
     FROM lampiran WHERE bidang_id = $1 ORDER BY kategori`, [bidang_id]);
  return NextResponse.json(rows);
}
