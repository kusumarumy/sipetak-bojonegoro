import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { query, transaksi } from '@/lib/db';
import { dapatMengubahAtribut, dapatMelihatDokumenPribadi } from '@/lib/rbac';
import type { StatusBidang } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

/** GET — satu kartu bidang lengkap. */
export async function GET(_req: Request, { params }: Ctx) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });
  const { id } = await params;
  const bolehPribadi = dapatMelihatDokumenPribadi(sesi.user.peran);

  const [b] = await query<any>(`
    SELECT b.id, b.kode, b.desa, b.kecamatan, b.luas_m2, b.luas_terdampak_m2,
           (COALESCE(b.luas_m2,0) - COALESCE(b.luas_terdampak_m2,0)) AS luas_sisa_m2,
           b.penggunaan, b.alas_hak, b.nib, b.njop_m2,
           b.batas_utara, b.batas_selatan, b.batas_timur, b.batas_barat,
           b.status, b.catatan_supervisor, b.tanggal_ukur,
           b.dikirim_pada, b.diverifikasi_pada,
           pt.nama AS petugas_nama
    FROM bidang b LEFT JOIN pengguna pt ON pt.id = b.petugas_id
    WHERE b.id = $1`, [id]);
  if (!b) return new NextResponse('Bidang tidak ditemukan', { status: 404 });

  const [pemilik, bangunan, tanaman, benda_lain, lampiran, riwayat] = await Promise.all([
    // NIK hanya keluar dari server bila peran berhak. Menyembunyikannya di CSS saja tidak aman.
    query(`SELECT id, urutan, nama, ${bolehPribadi ? 'nik' : 'NULL AS nik'}, alamat, telepon,
                  pekerjaan, hubungan, npwp, bank_nama, ${bolehPribadi ? 'bank_rek' : 'NULL AS bank_rek'}
           FROM pemilik WHERE bidang_id = $1 ORDER BY urutan`, [id]),
    query('SELECT * FROM bangunan WHERE bidang_id = $1', [id]),
    query('SELECT * FROM tanaman WHERE bidang_id = $1 ORDER BY jenis', [id]),
    query('SELECT * FROM benda_lain WHERE bidang_id = $1', [id]),
    query(`SELECT l.id, l.kategori, l.nama_asli, l.mime, l.ukuran_byte, l.lat, l.lon,
                  l.diambil_pada, l.sensitif, l.diunggah_pada, u.nama AS diunggah_oleh_nama
           FROM lampiran l LEFT JOIN pengguna u ON u.id = l.diunggah_oleh
           WHERE l.bidang_id = $1 ORDER BY l.kategori, l.diunggah_pada`, [id]),
    query(`SELECT a.id, a.aksi, a.kolom, a.nilai_lama, a.nilai_baru, a.pada, u.nama AS oleh
           FROM audit_log a LEFT JOIN pengguna u ON u.id = a.pengguna_id
           WHERE a.bidang_id = $1 ORDER BY a.pada DESC LIMIT 100`, [id])
  ]);

  return NextResponse.json({ ...b, pemilik, bangunan, tanaman, benda_lain, lampiran, riwayat });
}

const SkemaUbah = z.object({
  desa: z.string().max(120).nullish(),
  kecamatan: z.string().max(120).nullish(),
  luas_m2: z.number().nonnegative().nullish(),
  luas_terdampak_m2: z.number().nonnegative().nullish(),
  penggunaan: z.string().max(80).nullish(),
  alas_hak: z.string().max(80).nullish(),
  nib: z.string().max(60).nullish(),
  njop_m2: z.number().nonnegative().nullish(),
  batas_utara: z.string().max(160).nullish(),
  batas_selatan: z.string().max(160).nullish(),
  batas_timur: z.string().max(160).nullish(),
  batas_barat: z.string().max(160).nullish(),
  tanggal_ukur: z.string().nullish(),
  pemilik: z.array(z.object({
    id: z.string().uuid().optional(),
    urutan: z.number().int().min(1).default(1),
    nama: z.string().min(1).max(160),
    nik: z.string().max(32).nullish(),
    alamat: z.string().max(240).nullish(),
    telepon: z.string().max(40).nullish(),
    pekerjaan: z.string().max(80).nullish(),
    hubungan: z.string().max(80).nullish()
  })).optional()
});

/** PATCH — ubah atribut. Hak akses ditentukan peran DAN status bidang. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sesi = await auth();
  if (!sesi?.user) return new NextResponse('Belum masuk', { status: 401 });
  const { id } = await params;

  const [row] = await query<{ status: StatusBidang }>('SELECT status FROM bidang WHERE id = $1', [id]);
  if (!row) return new NextResponse('Bidang tidak ditemukan', { status: 404 });
  if (!dapatMengubahAtribut(sesi.user.peran, row.status))
    return new NextResponse('Bidang terkunci untuk peran ini', { status: 403 });

  const parsed = SkemaUbah.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ pesan: 'Data tidak valid', detail: parsed.error.flatten() }, { status: 400 });

  const { pemilik, ...kolom } = parsed.data;
  const isi = Object.entries(kolom).filter(([, v]) => v !== undefined);

  await transaksi(sesi.user.id, async (c) => {
    if (isi.length) {
      const set = isi.map(([k], i) => `${k} = $${i + 2}`).join(', ');
      await c.query(`UPDATE bidang SET ${set} WHERE id = $1`, [id, ...isi.map(([, v]) => v)]);
    }
    if (pemilik) {
      for (const p of pemilik) {
        if (p.id) {
          await c.query(`UPDATE pemilik SET urutan=$2, nama=$3, nik=$4, alamat=$5,
                         telepon=$6, pekerjaan=$7, hubungan=$8 WHERE id=$1 AND bidang_id=$9`,
            [p.id, p.urutan, p.nama, p.nik, p.alamat, p.telepon, p.pekerjaan, p.hubungan, id]);
        } else {
          await c.query(`INSERT INTO pemilik (bidang_id, urutan, nama, nik, alamat, telepon, pekerjaan, hubungan)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [id, p.urutan, p.nama, p.nik, p.alamat, p.telepon, p.pekerjaan, p.hubungan]);
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}
