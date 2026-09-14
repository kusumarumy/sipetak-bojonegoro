import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { unggahObjek, penyimpananSiap } from "@/lib/r2";

export const runtime = "nodejs";

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
    const namaAsli =
      (form.get("nama_asli") as string) || "file";

    if (!file || !bidangId || !kategori) {
      return NextResponse.json(
        { error: "file / bidang_id / kategori kosong" },
        { status: 400 }
      );
    }

    const ext = namaAsli.includes(".")
      ? namaAsli.split(".").pop()
      : "bin";

    const objectKey =
      `bidang/${bidangId}/foto/${kategori}/${Date.now()}-${randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await unggahObjek(
      objectKey,
      buffer,
      file.type || "application/octet-stream"
    );

    return NextResponse.json({
      object_key: objectKey,
    });

  } catch (e) {
    console.error("API UNGGAH ERROR:", e);

    const err = e as any;

    console.error("R2 ERROR DETAIL:", {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      statusCode: err?.$metadata?.httpStatusCode,
      requestId: err?.$metadata?.requestId,
      extendedRequestId: err?.$metadata?.extendedRequestId,
    });

    return NextResponse.json(
      {
        error: e instanceof Error
          ? e.message
          : "Gagal unggah",
      },
      { status: 500 }
    );
  }
}
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
