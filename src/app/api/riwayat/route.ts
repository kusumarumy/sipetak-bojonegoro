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
        a.id,

        /*
         * ID record bidang_tanah
         */
        a.record_id,

        /*
         * Data bidang
         */
        b.fid,
        b.nib,

        /*
         * Informasi aksi
         */
        a.aksi,
        a.kolom,
        a.nilai_lama,
        a.nilai_baru,

        /*
         * Informasi pengguna
         */
        a.pengguna_id,
        a.nama_akun,
        a.ip_address,

        /*
         * Waktu aksi
         */
        a.pada

      FROM public.audit_log a

      LEFT JOIN public.bidang_tanah b
        ON b.id = a.record_id::text

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
