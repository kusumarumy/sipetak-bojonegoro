import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { unggahObjek, penyimpananSiap } from "@/lib/r2"; // sesuaikan path r2.ts Anda

export const runtime = "nodejs"; // wajib: butuh Buffer/crypto, bukan edge

export async function POST(req: NextRequest) {
  try {
    if (!penyimpananSiap()) {
      return NextResponse.json(
        { error: "Penyimpanan belum dikonfigurasi" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const bidangId = form.get("bidang_id") as string | null;
    const kategori = form.get("kategori") as string | null;
    const namaAsli = (form.get("nama_asli") as string) || "file";

    if (!file || !bidangId || !kategori) {
      return NextResponse.json(
        { error: "file / bidang_id / kategori kosong" },
        { status: 400 }
      );
    }

    // susun object key — samakan dengan pola presign Anda
    const ext = namaAsli.includes(".") ? namaAsli.split(".").pop() : "bin";
    const objectKey = `bidang/${bidangId}/foto/${kategori}/${Date.now()}-${randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await unggahObjek(objectKey, buffer, file.type || "application/octet-stream");

    return NextResponse.json({ object_key: objectKey });
  } catch (e) {
    console.error("API UNGGAH:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal unggah" },
      { status: 500 }
    );
  }
}
