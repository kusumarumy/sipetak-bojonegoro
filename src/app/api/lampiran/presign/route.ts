import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { dapatMengubahAtribut } from '@/lib/rbac';
import { urlUnggah, susunKunci } from '@/lib/r2';
import type { StatusBidang } from '@/types';

const Skema = z.object({
  bidang_id: z.string().uuid(),
  kategori: z.string().min(3).max(40),
  nama_asli: z.string().min(1).max(200),
  mime: z.string().regex(/^(image\/(jpeg|png|webp|heic)|application\/pdf)$/),
  ukuran_byte: z.number().int().positive().max(25 * 1024 * 1024)   // 25 MB per berkas
});

/**
 * Menerbitkan URL unggah sekali pakai. Peramban mengunggah langsung ke R2,
 * lalu memanggil POST /api/lampiran untuk mencatat metadatanya.
 */
export async function POST(req: Request) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });

  const parsed = Skema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ pesan: 'Berkas ditolak', detail: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const [b] = await query<{ kode: string; status: StatusBidang }>(
    'SELECT kode, status FROM bidang WHERE id = $1', [d.bidang_id]);
  if (!b) return new NextResponse('Bidang tidak ditemukan', { status: 404 });
  if (!dapatMengubahAtribut(sesi.user.peran, b.status))
    return new NextResponse('Bidang terkunci untuk peran ini', { status: 403 });

  const object_key = susunKunci(b.kode, d.kategori, d.nama_asli);
  const url = await urlUnggah(object_key, d.mime);
  return NextResponse.json({ url, object_key });
}
