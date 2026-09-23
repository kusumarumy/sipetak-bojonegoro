import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse("Belum masuk", {
      status: 401,
    });
  }

  try {
    const data = await query(`
      SELECT
        a.*,
        b.fid,
        b.id AS bidang_id,
        b.nib
      FROM public.audit_log a

      LEFT JOIN public.bidang_tanah b
        ON b.id = a.record_id::varchar

      ORDER BY
        a.id DESC
    `);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });

  } catch (error) {
    console.error(
      "GET /api/riwayat ERROR:",
      error
    );

    return NextResponse.json(
      {
        pesan: "Gagal memuat riwayat aksi",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
