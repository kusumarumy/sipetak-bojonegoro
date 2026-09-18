import { NextRequest, NextResponse } from "next/server";
import { unggahObjek } from "@/lib/r2";
import { auth } from "@/lib/auth";
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

    console.log("R2 UPLOAD BERHASIL:", {
      namaFile: file.name,
      key,
    });

    // 2. Ambil session
    const sesi = await auth();

    console.log("SESSION:", {
      user: sesi?.user,
    });

    if (!sesi?.user) {
      console.error("AUDIT GAGAL: user tidak ditemukan");

      return NextResponse.json({
        ok: true,
        key,
        audit: false,
        alasan: "User tidak ditemukan",
      });
    }

    // 3. INSERT AUDIT
    try {
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
          pada
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `,
        [
          "r2",
          null,
          null,
          "UPLOAD",
          "file",
          null,
          file.name,
          sesi.user.id,
        ]
      );

      console.log("AUDIT UPLOAD BERHASIL:", file.name);

    } catch (auditError: any) {
      console.error("AUDIT INSERT ERROR:", {
        message: auditError?.message,
        detail: auditError?.detail,
        code: auditError?.code,
        constraint: auditError?.constraint,
      });

      return NextResponse.json({
        ok: true,
        key,
        audit: false,
        auditError: auditError?.message,
      });
    }

    return NextResponse.json({
      ok: true,
      key,
      audit: true,
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
