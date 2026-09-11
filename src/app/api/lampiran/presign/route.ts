import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { dapatMengubahAtribut } from "@/lib/rbac";
import { urlUnggah } from "@/lib/r2";
import type { StatusBidang } from "@/types";

const Skema = z.object({
  bidang_id: z.string().regex(/^\d+$/),
  kategori: z.string().min(3).max(40),
  nama_asli: z.string().min(1).max(200),
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

/**
 * Menerbitkan URL upload langsung ke Cloudflare R2.
 *
 * Struktur object key:
 *
 * bidang/
 *   191/
 *     foto/
 *       foto_bidang/
 *         uuid.jpg
 *
 *     dokumen/
 *       dok_ktp/
 *         uuid.pdf
 */

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

  const parsed = Skema.safeParse(
    await req.json()
  );

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
      kode_bid: string | null;
      bidang_id: string | null;
      fid: string | null;
      status: StatusBidang;
    }>(
      `
      SELECT
        id,
        kode_bid,
        bidang_id,
        fid,
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
     TENTUKAN KATEGORI
     ===================================================== */

  const kategoriFoto = [
    "foto_bidang",
    "foto_patok",
    "foto_bangunan_depan",
    "foto_bangunan_kiri",
    "foto_bangunan_kanan",
    "foto_bangunan_belakang",
    "foto_akses",
    "foto_pemilik_petugas",
  ];

  const kategoriDokumen = [
    "dok_ktp",
    "dok_kk",
    "dok_sertipikat",
    "dok_sppt",
    "dok_ahli_waris",
    "dok_kuasa",
    "dok_rekening",
    "dok_berita_acara",
  ];

  let folder = "lainnya";

  if (kategoriFoto.includes(d.kategori)) {
    folder = "foto";
  } else if (
    kategoriDokumen.includes(
      d.kategori
    )
  ) {
    folder = "dokumen";
  }

  /* =====================================================
     IDENTITAS FOLDER BIDANG
     ===================================================== */

  const identitasBidang =
    b.kode_bid ??
    b.bidang_id ??
    b.fid ??
    String(b.id);

  /*
   * Kita pakai ID numerik sebagai direktori utama
   * supaya tidak berubah jika kode bidang diedit.
   *
   * Bucket:
   * bojonegoro-dataset
   *
   * Object key:
   * bidang/191/foto/foto_bidang/.....
   */

  const ekstensi =
    d.nama_asli.includes(".")
      ? d.nama_asli
          .split(".")
          .pop()
          ?.toLowerCase()
      : "bin";

  const namaUnik =
    `${new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14)}-${crypto.randomUUID()}.${ekstensi}`;

  const object_key =
    `bidang/${b.id}/${folder}/${d.kategori}/${namaUnik}`;

  /* =====================================================
     PRESIGNED URL
     ===================================================== */

  const url = await urlUnggah(
    object_key,
    d.mime
  );

  return NextResponse.json({
    url,
    object_key,
  });
}
