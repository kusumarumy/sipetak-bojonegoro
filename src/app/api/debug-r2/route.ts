import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

/** Endpoint sementara — hapus setelah masalah unggah selesai. */
export async function GET() {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });

  const cek = (v?: string) =>
    !v ? 'KOSONG' : {
      panjang: v.length,
      adaSpasi: /\s/.test(v),
      heksadesimal: /^[0-9a-f]+$/i.test(v),
      awal: v.slice(0, 4)
    };

  return NextResponse.json({
    account:   cek(process.env.BOJO_R2_ACCOUNT_ID),
    accessKey: cek(process.env.BOJO_R2_ACCESS_KEY_ID),
    secret:    cek(process.env.BOJO_R2_SECRET_ACCESS_KEY),
    bucket:    process.env.BOJO_R2_BUCKET ?? 'KOSONG'
  });
}
