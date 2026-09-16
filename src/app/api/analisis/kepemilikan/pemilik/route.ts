import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bidang_tanah')
      .select('nik_milik, nama_milik');

    if (error) {
      console.error('Gagal mengambil pemilik:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const pemilikMap = new Map<
      string,
      {
        nik: string;
        nama: string;
        jumlah_bidang: number;
      }
    >();

    for (const row of data ?? []) {
      const nik = row.nik_milik?.trim();
      const nama = row.nama_milik?.trim();

      if (!nik) continue;

      const existing = pemilikMap.get(nik);

      if (existing) {
        existing.jumlah_bidang += 1;

        if (!existing.nama && nama) {
          existing.nama = nama;
        }
      } else {
        pemilikMap.set(nik, {
          nik,
          nama: nama ?? '',
          jumlah_bidang: 1,
        });
      }
    }

    const pemilik = Array.from(
      pemilikMap.values()
    ).sort((a, b) =>
      a.nama.localeCompare(b.nama, 'id')
    );

    return NextResponse.json(pemilik);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Gagal mengambil daftar pemilik.' },
      { status: 500 }
    );
  }
}
