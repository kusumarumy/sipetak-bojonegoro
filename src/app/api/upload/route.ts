import { NextRequest, NextResponse } from "next/server";
import { unggahObjek } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const key = form.get("key") as string;

    if (!file || !key) {
      return NextResponse.json({ error: "file/key kosong" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await unggahObjek(key, buffer, file.type || "application/octet-stream");

    return NextResponse.json({ ok: true, key });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mengunggah file" }, { status: 500 });
  }
}
