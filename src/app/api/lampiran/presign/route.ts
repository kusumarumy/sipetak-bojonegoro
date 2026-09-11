import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { dapatMengubahAtribut } from "@/lib/rbac";
import { urlUnggah } from "@/lib/r2";
import type { StatusBidang } from "@/types";

const Skema = z.object({
  bidang_id: z
    .string()
    .regex(/^\d+$/, "ID bidang tidak valid"),

  kategori: z
    .string()
    .min(3)
    .max(40),

  nama_asli: z
    .string()
    .min(1)
    .max(200),

  mime: z
    .string()
    .regex(
      /^(image\/(jpeg|png|webp|heic)|application\/pdf)$/
    ),

  ukuran_byte: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
});

const KATEGORI_FOTO = new Set([
  "foto_bidang",
  "foto_patok",
  "foto_bangunan_depan",
  "foto_bangunan_kiri",
  "foto_bangunan_kanan",
  "foto_bangunan_belakang",
  "foto_akses",
  "foto_pemilik_petugas",
]);

const KATEGORI_DOKUMEN = new Set([
  "dok_ktp",
  "dok_kk",
  "dok_sertipikat",
  "dok_sppt",
  "dok_ahli_waris",
  "dok_kuasa",
  "dok_rekening",
  "dok_berita_acara",
]);

export async function POST(req: Request) {
  try {
    /* =====================================================
       AUTH
       ===================================================== */

    const sesi = await auth();

    if (!sesi?.user) {
      return new NextResponse(
        "Belum masuk",
        { status: 401 }
      );
    }

    /* =====================================================
       VALIDASI REQUEST
       ===================================================== */

    const body = await req.json();

    const parsed =
      Skema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          pesan: "Berkas ditolak",
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

    const [b] =
      await query<{
        id: number;
        status: StatusBidang;
      }>(
        `
        SELECT
          id,
          status
        FROM public.bidang_tanah
        WHERE id = $1
        `,
        [d.bidang_id]
      );

    if (!b) {
      return new NextResponse(
        "Bidang tidak ditemukan",
        { status: 404 }
      );
    }

    /* =====================================================
       CEK RBAC
       ===================================================== */

    if (
      !dapatMengubahAtribut(
        sesi.user.peran,
        b.status
      )
    ) {
      return new NextResponse(
        "Bidang terkunci untuk peran ini",
        { status: 403 }
      );
    }

    /* =====================================================
       TENTUKAN FOLDER
       ===================================================== */

    let folder = "lainnya";

    if (
      KATEGORI_FOTO.has(
        d.kategori
      )
    ) {
      folder = "foto";
    } else if (
      KATEGORI_DOKUMEN.has(
        d.kategori
      )
    ) {
      folder = "dokumen";
    } else {
      return NextResponse.json(
        {
          pesan:
            "Kategori berkas tidak dikenali",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       EKSTENSI FILE
       ===================================================== */

    const ekstensi =
      d.nama_asli.includes(".")
        ? (
            d.nama_asli
              .split(".")
              .pop() ?? "bin"
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9]/g,
              ""
            )
        : "bin";

    /* =====================================================
       NAMA OBJECT UNIK
       ===================================================== */

    const namaUnik =
      `${Date.now()}-${crypto.randomUUID()}.${ekstensi}`;

    /* =====================================================
       OBJECT KEY R2

       Bucket:
       bojonegoro-dataset

       Key:
       bidang/191/foto/foto_bidang/...
       ===================================================== */

    const object_key =
      `bidang/${b.id}/${folder}/${d.kategori}/${namaUnik}`;

    console.log(
      "[R2 PRESIGN]",
      {
        bucket:
          process.env.R2_BUCKET
            ? "configured"
            : "MISSING",
        account:
          process.env.R2_ACCOUNT_ID
            ? "configured"
            : "MISSING",
        access:
          process.env.R2_ACCESS_KEY_ID
            ? "configured"
            : "MISSING",
        secret:
          process.env.R2_SECRET_ACCESS_KEY
            ? "configured"
            : "MISSING",
        bidang_id: b.id,
        kategori: d.kategori,
        object_key,
        mime: d.mime,
      }
    );

    /* =====================================================
       BUAT PRESIGNED URL
       ===================================================== */

    const url =
      await urlUnggah(
        object_key,
        d.mime
      );

    return NextResponse.json({
      url,
      object_key,
    });
  } catch (error) {
    console.error(
      "POST /api/lampiran/presign ERROR:",
      error
    );

    return NextResponse.json(
      {
        pesan:
          "Gagal membuat URL upload",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
