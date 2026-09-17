import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const sesi = await auth();
  if (sesi?.user?.peran !== 'pengembang')
    return new NextResponse('Tidak diizinkan', { status: 403 });

  const cek = (v?: string) => !v ? 'KOSONG' : {
    panjang: v.length,
    adaSpasi: /\s/.test(v),
    awal: v.slice(0, 4),
  };

  return NextResponse.json({
    account: cek(process.env.R2_ACCOUNT_ID),
    accessKey: cek(process.env.R2_ACCESS_KEY_ID),
    secret: cek(process.env.R2_SECRET_ACCESS_KEY),
    bucket: process.env.R2_BUCKET ?? 'KOSONG',
  });
}
