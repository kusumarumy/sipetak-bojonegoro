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
    const bidangId = form.get("bidang_id") as string | null;
    const kategori = form.get("kategori") as string | null;

    const namaAsli =
      (form.get("nama_asli") as string) || "file";

    if (!file || !bidangId || !kategori) {
      return NextResponse.json(
        {
          error: "file / bidang_id / kategori kosong",
        },
        { status: 400 }
      );
    }

    const ext = namaAsli.includes(".")
      ? namaAsli.split(".").pop()?.toLowerCase() || "bin"
      : "bin";

    const objectKey =
      `bidang/${bidangId}/foto/${kategori}/` +
      `${Date.now()}-${randomUUID()}.${ext}`;

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    console.log("UPLOAD REQUEST", {
      objectKey,
      namaAsli,
      bidangId,
      kategori,
      mime: file.type,
      size: file.size,
    });

    await unggahObjek(
      objectKey,
      buffer,
      file.type || "application/octet-stream"
    );

    console.log("UPLOAD FINISHED", {
      objectKey,
    });

    const sesi = await auth();

    console.log("UPLOAD USER", {
      userId: sesi?.user?.id,
      nama: sesi?.user?.name,
    });

    const hasilBidang = await query(
      `
      SELECT bidang_id
      FROM public.bidang_tanah
      WHERE id = $1
      LIMIT 1
      `,
      [Number(bidangId)]
    );

    const bidangData = hasilBidang[0];

    if (!bidangData) {
      throw new Error(
        `Bidang dengan id ${bidangId} tidak ditemukan`
      );
    }

    const ipAddress =
      req.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

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
        Number(bidangId),
        bidangData.bidang_id,
        "UPLOAD",
        kategori,
        null,
        namaAsli,
        sesi?.user?.id ?? null,
        sesi?.user?.name ?? null,
        ipAddress,
      ]
    );

    console.log("AUDIT UPLOAD FINISHED", {
      record_id: Number(bidangId),
      bidang_id: bidangData.bidang_id,
      kategori,
      namaAsli,
      pengguna_id: sesi?.user?.id ?? null,
      nama_akun: sesi?.user?.name ?? null,
      ip_address: ipAddress,
    });

    return NextResponse.json({
      success: true,
      object_key: objectKey,
    });

  } catch (e: any) {
    console.error("API UNGGAH ERROR:", e);

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
