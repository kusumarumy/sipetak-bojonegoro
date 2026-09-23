import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { query, transaksi } from "@/lib/db";

const Skema = z.object({
  fid: z.coerce
    .number()
    .int()
    .positive("FID tidak valid"),

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

  diambil_pada: z
    .string()
    .nullish(),
});

export async function POST(req: Request) {
  const sesi = await auth();

  if (!sesi?.user) {
    return NextResponse.json(
      { pesan: "Belum masuk" },
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
          detail: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const d = parsed.data;

    /*
     * Pastikan bidang dengan FID tersebut ada
     */
    const bidang = await query(
      `
      SELECT fid
      FROM public.bidang_tanah
      WHERE fid = $1
      LIMIT 1
      `,
      [d.fid]
    );

    if (!bidang[0]) {
      return NextResponse.json(
        {
          pesan: "Bidang tidak ditemukan",
          fid: d.fid,
        },
        { status: 404 }
      );
    }

    const [row] = await transaksi(
      sesi.user.id,
      async (c) => {
        const hasil = await c.query(
          `
          INSERT INTO public.lampiran (
            fid,
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
          ON CONFLICT (object_key)
          DO UPDATE SET
            fid = EXCLUDED.fid,
            kategori = EXCLUDED.kategori,
            nama_asli = EXCLUDED.nama_asli,
            mime = EXCLUDED.mime,
            ukuran_byte = EXCLUDED.ukuran_byte,
            lat = EXCLUDED.lat,
            lon = EXCLUDED.lon,
            diambil_pada = EXCLUDED.diambil_pada,
            diunggah_oleh = EXCLUDED.diunggah_oleh,
            diunggah_pada = NOW()
          RETURNING
            id,
            fid,
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
            d.fid,
            d.kategori,
            d.object_key,
            d.nama_asli ?? null,
            d.mime ?? null,
            d.ukuran_byte ?? null,
            d.lat ?? null,
            d.lon ?? null,
            d.diambil_pada ?? null,
            sesi.user.id,
          ]
        );

        return hasil.rows;
      }
    );

    return NextResponse.json(row);
  } catch (error: any) {
    console.error(
      "POST /api/lampiran ERROR:",
      error
    );

    if (error?.code === "23503") {
      return NextResponse.json(
        {
          pesan: "FID bidang tidak ditemukan",
        },
        { status: 404 }
      );
    }

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

export async function GET(req: Request) {
  const sesi = await auth();

  if (!sesi?.user) {
    return NextResponse.json(
      { pesan: "Belum masuk" },
      { status: 401 }
    );
  }

  try {
    const fidText =
      new URL(req.url)
        .searchParams
        .get("fid");

    if (
      !fidText ||
      !/^\d+$/.test(fidText)
    ) {
      return NextResponse.json(
        {
          pesan: "fid tidak valid",
        },
        { status: 400 }
      );
    }

    const fid = Number(fidText);

    const rows = await query(
      `
      SELECT
        id,
        fid,
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
      WHERE fid = $1
      ORDER BY
        kategori,
        diunggah_pada DESC
      `,
      [fid]
    );

    return NextResponse.json(rows);
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
