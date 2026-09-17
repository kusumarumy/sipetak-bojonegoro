import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { unggahObjek, penyimpananSiap } from "@/lib/r2";

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

    // Ambil ekstensi file
    const ext = namaAsli.includes(".")
      ? namaAsli.split(".").pop()?.toLowerCase() || "bin"
      : "bin";

    // Nama objek di R2
    const objectKey =
      `bidang/${bidangId}/foto/${kategori}/` +
      `${Date.now()}-${randomUUID()}.${ext}`;

    // File → Buffer
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

    // Upload ke Cloudflare R2
    await unggahObjek(
      objectKey,
      buffer,
      file.type || "application/octet-stream"
    );

    console.log("UPLOAD FINISHED", {
      objectKey,
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
