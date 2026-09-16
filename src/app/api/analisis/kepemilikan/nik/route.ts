import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nik: string }> }
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', {
      status: 401,
    });
  }

  try {
    const { nik } = await params;

    const nikBersih = nik?.trim();

    if (!nikBersih) {
      return NextResponse.json(
        { error: 'NIK tidak valid.' },
        { status: 400 }
      );
    }

    const bidang = await query<{
      id: number;
      bidang_id: string | null;
      nib: string | null;

      nama_milik: string | null;
      nik_milik: string | null;

      nama_sewa: string | null;
      nik_sewa: string | null;

      kecamatan: string | null;
      kelurahan: string | null;

      luas_tnh: number | null;
      luas_terdampak_m2: number | null;
      luas_sisa_m2: number | null;

      dampak_tnh: string | null;
      penggunaan: string | null;
      sta_tnh: string | null;
    }>(
      `
      SELECT
        id,
        bidang_id,
        nib,

        nama_milik,
        nik_milik,

        nama_sewa,
        nik_sewa,

        kecamatan,
        kelurahan,

        luas_tnh,
        luas_terdampak_m2,
        luas_sisa_m2,

        dampak_tnh,
        penggunaan,
        sta_tnh

      FROM public.bidang_tanah

      WHERE TRIM(nik_milik) = $1

      ORDER BY bidang_id ASC
      `,
      [nikBersih]
    );

    const jumlahBidang = bidang.length;

    const totalLuas = bidang.reduce(
      (total, b) =>
        total + (Number(b.luas_tnh) || 0),
      0
    );

    const totalLuasTerdampak = bidang.reduce(
      (total, b) =>
        total + (Number(b.luas_terdampak_m2) || 0),
      0
    );

    const totalLuasSisa = bidang.reduce(
      (total, b) =>
        total + (Number(b.luas_sisa_m2) || 0),
      0
    );

    const jumlahBidangTerdampak =
      bidang.filter(
        (b) =>
          Number(b.luas_terdampak_m2) > 0
      ).length;

    const namaPemilik =
      bidang.find(
        (b) =>
          b.nama_milik &&
          b.nama_milik.trim()
      )?.nama_milik ?? '';

    return NextResponse.json({
      pemilik: {
        nama: namaPemilik,
        nik: nikBersih,
      },

      ringkasan: {
        jumlahBidang,
        totalLuas,
        totalLuasTerdampak,
        totalLuasSisa,
        jumlahBidangTerdampak,
      },

      bidang,
    });

  } catch (error) {
    console.error(
      'GET /api/analisis/kepemilikan/[nik] ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
