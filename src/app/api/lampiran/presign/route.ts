import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { dapatMengubahAtribut } from "@/lib/rbac";
import { urlUnggah } from "@/lib/r2";
import type { StatusBidang } from "@/types";

const Skema = z.object({
  fid: z.coerce
    .number()
    .int()
    .positive("FID tidak valid"),

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
    const sesi = await auth();

    if (!sesi?.user) {
      return new NextResponse(
        "Belum masuk",
        { status: 401 }
      );
    }

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

    /*
     * Cari bidang berdasarkan FID,
     * bukan ID sumber.
     */
    const [b] = await query<{
      id: string;
      fid: number;
      status: StatusBidang;
    }>(
      `
      SELECT
        id,
        fid,
        status
      FROM public.bidang_tanah
      WHERE fid = $1
      LIMIT 1
      `,
      [d.fid]
    );

    if (!b) {
      return new NextResponse(
        "Bidang tidak ditemukan",
        { status: 404 }
      );
    }

    /*
     * Cek apakah user masih boleh
     * mengubah data bidang.
     */
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

    /*
     * Tentukan folder R2.
     */
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

    /*
     * Ambil extension file.
     */
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

    /*
     * Nama file unik.
     */
    const namaUnik =
      `${Date.now()}-${crypto.randomUUID()}.${ekstensi}`;

    /*
     * R2 sekarang menggunakan FID.
     *
     * Contoh:
     * bidang/191/foto/foto_bidang/xxxxx.jpg
     */
    const object_key =
      `bidang/${b.fid}/${folder}/${d.kategori}/${namaUnik}`;

    console.log(
      "[R2 PRESIGN]",
      {
        bucket:
          process.env.BOJO_R2_BUCKET
            ? "configured"
            : "MISSING",

        account:
          process.env.BOJO_R2_ACCOUNT_ID
            ? "configured"
            : "MISSING",

        access:
          process.env.BOJO_R2_ACCESS_KEY_ID
            ? "configured"
            : "MISSING",

        secret:
          process.env.BOJO_R2_SECRET_ACCESS_KEY
            ? "configured"
            : "MISSING",

        fid: b.fid,
        kategori: d.kategori,
        object_key,
        mime: d.mime,
      }
    );

    /*
     * Buat presigned upload URL.
     */
    const url =
      await urlUnggah(
        object_key,
        d.mime
      );

    return NextResponse.json({
      url,
      object_key,
      fid: b.fid,
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
