import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { unggahObjek, penyimpananSiap } from "@/lib/r2";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!penyimpananSiap()) {
      return NextResponse.json(
        {
          error: "Penyimpanan belum dikonfigurasi",
        },
        { status: 500 }
      );
    }

    const form = await req.formData();

    const file = form.get("file") as File | null;

    const fidText = form.get("fid") as string | null;

    const kategori = form.get("kategori") as string | null;

    const namaAsli =
      (form.get("nama_asli") as string) || "file";

    if (!file || !fidText || !kategori) {
      return NextResponse.json(
        {
          error: "file / fid / kategori kosong",
        },
        { status: 400 }
      );
    }

    const fid = Number(fidText);

    if (!Number.isInteger(fid)) {
      return NextResponse.json(
        {
          error: `FID tidak valid: ${fidText}`,
        },
        { status: 400 }
      );
    }

    /*
     * Pastikan FID memang ada di bidang_tanah
     */
    const hasilBidang = await query(
      `
      SELECT fid
      FROM public.bidang_tanah
      WHERE fid = $1
      LIMIT 1
      `,
      [fid]
    );

    if (!hasilBidang[0]) {
      return NextResponse.json(
        {
          error: `Bidang dengan FID ${fid} tidak ditemukan`,
        },
        { status: 404 }
      );
    }

    /*
     * Extension file
     */
    const ext = namaAsli.includes(".")
      ? namaAsli.split(".").pop()?.toLowerCase() || "bin"
      : "bin";

    /*
     * Struktur R2:
     *
     * bidang/
     *   191/
     *     foto/
     *       bidang/
     *         123456-uuid.jpg
     */
    const objectKey =
      `bidang/${fid}/foto/${kategori}/` +
      `${Date.now()}-${randomUUID()}.${ext}`;

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    console.log("UPLOAD REQUEST", {
      objectKey,
      namaAsli,
      fid,
      kategori,
      mime: file.type,
      size: file.size,
    });

    /*
     * Upload ke R2
     */
    await unggahObjek(
      objectKey,
      buffer,
      file.type || "application/octet-stream"
    );

    console.log("UPLOAD FINISHED", {
      objectKey,
    });

    /*
     * User login
     */
    const sesi = await auth();

    console.log("UPLOAD USER", {
      userId: sesi?.user?.id,
      nama: sesi?.user?.name,
      username: sesi?.user?.username,
    });

    /*
     * IP address
     */
    const ipAddress =
      req.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    /*
     * Audit log
     *
     * Untuk audit, kita tetap menggunakan
     * kolom bidang_id jika kolom tersebut
     * memang ada di audit_log.
     *
     * Nilainya sekarang adalah FID.
     */
    await query(
      `
      INSERT INTO public.audit_log
      (
        tabel,
        record_id,
        bidang_id,
        aksi,
        kolom,
        nilai_lama,
        nilai_baru,
        pengguna_id,
        nama_akun,
        ip_address,
        pada
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        NOW()
      )
      `,
      [
        "lampiran",
        fid,
        fid,
        "UPLOAD",
        kategori,
        null,
        namaAsli,
        sesi?.user?.id ?? null,
        sesi?.user?.name ??
          sesi?.user?.username ??
          null,
        ipAddress,
      ]
    );

    console.log("AUDIT UPLOAD FINISHED", {
      record_id: fid,
      bidang_id: fid,
      kategori,
      namaAsli,
      pengguna_id: sesi?.user?.id ?? null,
      nama_akun:
        sesi?.user?.name ??
        sesi?.user?.username ??
        null,
      ip_address: ipAddress,
    });

    return NextResponse.json({
      success: true,
      fid,
      object_key: objectKey,
    });

  } catch (e: any) {
    console.error(
      "API UNGGAH ERROR:",
      e
    );

    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Gagal unggah",
      },
      { status: 500 }
    );
  }
}
