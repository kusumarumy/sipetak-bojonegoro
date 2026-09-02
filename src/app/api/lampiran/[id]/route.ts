import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, transaksi } from '@/lib/db';
import { dapatMelihatDokumenPribadi, dapatMengubahAtribut } from '@/lib/rbac';
import { urlBaca, hapusObjek } from '@/lib/r2';
import type { StatusBidang } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/lampiran/:id — mengembalikan URL baca berumur 5 menit.
 * Berkas sensitif (KTP, KK, sertipikat) ditolak untuk peran pelihat di sini,
 * bukan sekadar disembunyikan di antarmuka.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });
  const { id } = await params;

  const [l] = await query<{ object_key: string; sensitif: boolean }>(
    'SELECT object_key, sensitif FROM lampiran WHERE id = $1', [id]);
  if (!l) return new NextResponse('Berkas tidak ditemukan', { status: 404 });
  if (l.sensitif && !dapatMelihatDokumenPribadi(sesi.user.peran))
    return new NextResponse('Dokumen pribadi tidak dibuka untuk peran ini', { status: 403 });

  return NextResponse.json({ url: await urlBaca(l.object_key) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });
  const { id } = await params;

  const [l] = await query<{ object_key: string; bidang_id: string; status: StatusBidang }>(
    `SELECT l.object_key, l.bidang_id, b.status
     FROM lampiran l JOIN bidang b ON b.id = l.bidang_id WHERE l.id = $1`, [id]);
  if (!l) return new NextResponse('Berkas tidak ditemukan', { status: 404 });
  if (!dapatMengubahAtribut(sesi.user.peran, l.status))
    return new NextResponse('Bidang terkunci untuk peran ini', { status: 403 });

  await transaksi(sesi.user.id, async (c) => { await c.query('DELETE FROM lampiran WHERE id = $1', [id]); });
  await hapusObjek(l.object_key);
  return NextResponse.json({ ok: true });
}
