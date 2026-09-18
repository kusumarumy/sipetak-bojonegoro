import { NextRequest, NextResponse } from "next/server";
import { unggahObjek } from "@/lib/r2";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const key = form.get("key") as string;

    if (!file || !key) {
      return NextResponse.json(
        { error: "file/key kosong" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload ke R2
    await unggahObjek(
      key,
      buffer,
      file.type || "application/octet-stream"
    );

    // 2. Catat audit UPLOAD
    await query(
      `
      INSERT INTO public.audit_log
      (
        tabel,
        aksi,
        kolom,
        nilai_lama,
        nilai_baru,
        record_id,
        bidang_id
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        "r2",
        "UPLOAD",
        "file",
        null,
        file.name,
        null,
        null,
      ]
    );

    return NextResponse.json({
      ok: true,
      key,
    });

  } catch (e: any) {
    console.error("UPLOAD ERROR:", e);

    return NextResponse.json(
      {
        error: e?.message || "Gagal mengunggah file",
      },
      { status: 500 }
    );
  }
}
