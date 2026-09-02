import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { query, transaksi } from '@/lib/db';
import { transisiSah } from '@/lib/rbac';
import { WAJIB, type StatusBidang } from '@/types';

const Skema = z.object({
  ke: z.enum(['draft', 'terkirim', 'terverifikasi', 'revisi']),
  catatan: z.string().max(1000).optional()
});

/**
 * POST /api/bidang/:id/status — pindahkan bidang di alur verifikasi.
 * Server memeriksa dua hal: transisinya sah untuk peran ini, dan berkas wajib
 * sudah lengkap sebelum bidang boleh dikirim.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });
  const { id } = await params;

  const parsed = Skema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse('Permintaan tidak valid', { status: 400 });
  const { ke, catatan } = parsed.data;

  const [b] = await query<{ status: StatusBidang }>('SELECT status FROM bidang WHERE id = $1', [id]);
  if (!b) return new NextResponse('Bidang tidak ditemukan', { status: 404 });

  if (!transisiSah(b.status, ke as StatusBidang, sesi.user.peran))
    return NextResponse.json(
      { pesan: `Tidak bisa memindahkan bidang dari "${b.status}" ke "${ke}" dengan peran ${sesi.user.peran}.` },
      { status: 403 });

  if (ke === 'terkirim') {
    const ada = await query<{ kategori: string }>(
      'SELECT DISTINCT kategori FROM lampiran WHERE bidang_id = $1', [id]);
    const punya = new Set(ada.map(r => r.kategori));
    const kurang = WAJIB.filter(k => !punya.has(k));
    if (kurang.length)
      return NextResponse.json(
        { pesan: 'Berkas wajib belum lengkap.', kurang }, { status: 422 });
  }

  if (ke === 'revisi' && !catatan?.trim())
    return NextResponse.json(
      { pesan: 'Tulis alasan pengembalian supaya pendata tahu apa yang harus diperbaiki.' },
      { status: 422 });

  await transaksi(sesi.user.id, async (c) => {
    await c.query(`
      UPDATE bidang SET
        status = $2,
        catatan_supervisor = CASE WHEN $2 = 'revisi' THEN $3 ELSE catatan_supervisor END,
        dikirim_pada = CASE WHEN $2 = 'terkirim' THEN now() ELSE dikirim_pada END,
        diverifikasi_pada = CASE WHEN $2 = 'terverifikasi' THEN now() ELSE NULL END,
        diverifikasi_oleh = CASE WHEN $2 = 'terverifikasi' THEN $4::uuid ELSE NULL END
      WHERE id = $1`, [id, ke, catatan ?? null, sesi.user.id]);
  });

  return NextResponse.json({ ok: true, status: ke });
}
