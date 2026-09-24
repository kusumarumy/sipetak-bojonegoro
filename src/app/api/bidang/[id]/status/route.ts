import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { query, transaksi } from '@/lib/db';
import { transisiSah } from '@/lib/rbac';
import type { StatusBidang } from '@/types';

const Skema = z.object({
  ke: z.enum([
    'terverifikasi',
    'revisi',
  ]),
  catatan: z.string().max(1000).optional(),
});
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', {
      status: 401,
    });
  }

  const { id } = await params;

  const parsed = Skema.safeParse(
    await req.json()
  );

  if (!parsed.success) {
    return new NextResponse(
      'Permintaan tidak valid',
      {
        status: 400,
      }
    );
  }

  const { ke, catatan } = parsed.data;

  try {
    const [b] = await query<{
      status: StatusBidang;
    }>(
      `
        SELECT status
        FROM public.bidang_tanah
        WHERE id = $1
      `,
      [id]
    );

    if (!b) {
      return new NextResponse(
        'Bidang tidak ditemukan',
        {
          status: 404,
        }
      );
    }
    if (
      !transisiSah(
        b.status,
        ke as StatusBidang,
        sesi.user.peran
      )
    ) {
      return NextResponse.json(
        {
          pesan:
            `Tidak bisa memindahkan bidang dari ` +
            `"${b.status}" ke "${ke}" ` +
            `dengan peran ${sesi.user.peran}.`,
        },
        {
          status: 403,
        }
      );
    }
    if (
      ke === 'revisi' &&
      !catatan?.trim()
    ) {
      return NextResponse.json(
        {
          pesan:
            'Tulis alasan pengembalian supaya pendata tahu apa yang harus diperbaiki.',
        },
        {
          status: 422,
        }
      );
    }
    await transaksi(
      sesi.user.id,
      async (c) => {
        await c.query(
          `
            UPDATE public.bidang_tanah
            SET
              status = $2,

              cat_spv =
                CASE
                  WHEN $2 = 'revisi'
                  THEN $3
                  ELSE cat_spv
                END,

              verif_at =
                CASE
                  WHEN $2 = 'terverifikasi'
                  THEN NOW()
                  ELSE NULL
                END

            WHERE id = $1
          `,
          [
            id,
            ke,
            catatan?.trim() || null,
          ]
        );
      }
    );

    return NextResponse.json({
      ok: true,
      status: ke,
    });

  } catch (error) {
    console.error(
      'POST /api/bidang/[id]/status ERROR:',
      error
    );

    return NextResponse.json(
      {
        pesan:
          'Gagal mengubah status bidang',
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
