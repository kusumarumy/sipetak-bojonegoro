import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { query, transaksi } from "@/lib/db";

/* =========================================================
   SCHEMA
   bidang_id sekarang adalah ID bigint dari bidang_tanah
   ========================================================= */

const Skema = z.object({
  bidang_id: z
    .string()
    .regex(/^\d+$/, "ID bidang tidak valid"),

  kategori: z
    .string()
    .min(3)
    .max(40),

  object_key: z
    .string()
    .min(5)
    .max(500),

  nama_asli: z
    .string()
    .max(200)
    .optional(),

  mime: z
    .string()
    .max(80)
    .optional(),

  ukuran_byte: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024)
    .optional(),

  lat: z
    .number()
    .min(-90)
    .max(90)
    .nullish(),

  lon: z
    .number()
    .min(-180)
    .max(180)
    .nullish(),

  diambil_pada:
    z.string().nullish(),
});

/* =========================================================
   POST
   Mencatat metadata file setelah file berhasil diunggah
   ke Cloudflare R2
   ========================================================= */

export async function POST(
  req: Request
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse(
      "Belum masuk",
      { status: 401 }
    );
  }

  try {
    const parsed = Skema.safeParse(
      await req.json()
    );

    if (!parsed.success) {
      return NextResponse.json(
        {
          pesan: "Metadata tidak valid",
          detail:
            parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const d = parsed.data;

    /* =====================================================
       CEK BIDANG
       ===================================================== */

    const [bidang] =
      await query<{
        id: number;
      }>(
        `
        SELECT id
        FROM public.bidang_tanah
        WHERE id = $1
        `,
        [d.bidang_id]
      );

    if (!bidang) {
      return new NextResponse(
        "Bidang tidak ditemukan",
        { status: 404 }
      );
    }

    /* =====================================================
       SIMPAN METADATA
       ===================================================== */

    const [row] =
      await transaksi(
        sesi.user.id,
        async (c) => {
          const hasil =
            await c.query(
              `
              INSERT INTO public.lampiran (
                bidang_id,
                kategori,
                object_key,
                nama_asli,
                mime,
                ukuran_byte,
                lat,
                lon,
                diambil_pada,
                diunggah_oleh
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10
              )
              RETURNING
                id,
                kategori,
                nama_asli,
                mime,
                ukuran_byte,
                lat,
                lon,
                diambil_pada,
                sensitif,
                diunggah_pada
              `,
              [
                Number(d.bidang_id),
                d.kategori,
                d.object_key,
                d.nama_asli ??
                  null,
                d.mime ??
                  null,
                d.ukuran_byte ??
                  null,
                d.lat ??
                  null,
                d.lon ??
                  null,
                d.diambil_pada ??
                  null,
                sesi.user.id,
              ]
            );

          return hasil.rows;
        }
      );

    return NextResponse.json(
      row
    );
  } catch (error) {
    console.error(
      "POST /api/lampiran ERROR:",
      error
    );

    return NextResponse.json(
      {
        pesan:
          "Gagal menyimpan metadata berkas",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET
   /api/lampiran?bidang_id=191

   Daftar lampiran satu bidang
   ========================================================= */

export async function GET(
  req: Request
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse(
      "Belum masuk",
      { status: 401 }
    );
  }

  try {
    const bidang_id =
      new URL(req.url)
        .searchParams
        .get("bidang_id");

    if (
      !bidang_id ||
      !/^\d+$/.test(bidang_id)
    ) {
      return new NextResponse(
        "bidang_id tidak valid",
        { status: 400 }
      );
    }

    const rows =
      await query(
        `
        SELECT
          id,
          kategori,
          object_key,
          nama_asli,
          mime,
          ukuran_byte,
          lat,
          lon,
          diambil_pada,
          sensitif,
          diunggah_pada,
          diunggah_oleh
        FROM public.lampiran
        WHERE bidang_id = $1
        ORDER BY
          kategori,
          diunggah_pada DESC
        `,
        [bidang_id]
      );

    return NextResponse.json(
      rows
    );
  } catch (error) {
    console.error(
      "GET /api/lampiran ERROR:",
      error
    );

    return NextResponse.json(
      {
        pesan:
          "Gagal mengambil daftar berkas",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
