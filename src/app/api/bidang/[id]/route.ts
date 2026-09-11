import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { query, transaksi } from '@/lib/db';
import { dapatMengubahAtribut } from '@/lib/rbac';
import type { StatusBidang } from '@/types';

type Ctx = {
  params: Promise<{ id: string }>;
};

/* =========================================================
   HELPER VALIDASI ANGKA
   Input dari HTML selalu berupa string.
   Contoh:
   "1250" -> 1250
   ""     -> null
   ========================================================= */

const angkaOpsional = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === '') {
      return null;
    }

    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : value;
  },
  z.number().nonnegative().nullable().optional()
);

const tahunOpsional = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === '') {
      return null;
    }

    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : value;
  },
  z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
);


/* =========================================================
   GET
   Mengambil data langsung dari public.bidang_tanah
   ========================================================= */

export async function GET(
  _req: Request,
  { params }: Ctx
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse(
      'Belum masuk',
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const [b] = await query<any>(
      `
      SELECT
        id,
        objectid,
        bidang_id,
        kodewilaya,
        kecamatan,
        kelurahan,
        tipehak,
        tipeproduk,
        tahun,

        nib,

        luastertul,
        luaspeta,
        luas_tnh,
        luas_terdampak_m2,
        luas_sisa_m2,
        sumbergeom,

        alatukur,
        penggunaan,
        metodukur,

        shape_leng,
        shape_area,

        hub_tnh,
        kode_wwc,
        jenis_tnh,

        kode_bid,
        rt_rw,

        nama_milik,
        ttl_milik,
        krja_milik,
        almt_milik,
        nik_milik,

        nama_sewa,
        ttl_sewa,
        krja_sewa,
        almt_sewa,
        nik_sewa,

        nomor_hp,

        sta_tnh,
        surat_hak,
        nomor_hak,
        alas_hak,

        ruang_atbt,
        luas_atbt,

        jenis_tnm,
        jumlah_tnm,

        jenis_bnd,
        jumlah_bnd,

        beban_hak,
        dampak_tnh,
        jml_bgn,

        date_updt,
        foto_tnh,

        fid,
        nama,
        layer,
        path,

        status,
        catatan_supervisor,
        petugas_nama,
        tanggal_ukur,
        dikirim_pada,
        diverifikasi_pada,

        created_at

      FROM public.bidang_tanah
      WHERE id = $1
      `,
      [id]
    );

    if (!b) {
      return new NextResponse(
        'Bidang tidak ditemukan',
        { status: 404 }
      );
    }

    /*
     * =====================================================
     * DATABASE → FRONTEND
     *
     * Nilai tetap berasal dari public.bidang_tanah.
     * Tidak membuat data yang tidak ada di database.
     * =====================================================
     */

    const bidang = {
      /* Identitas */
      id: String(b.id),

      kode:
        b.kode_bid ??
        b.bidang_id ??
        b.fid ??
        null,

      bidang_id: b.bidang_id,
      objectid: b.objectid,
      kodewilaya: b.kodewilaya,
      kode_bid: b.kode_bid,
      fid: b.fid,

      /* Lokasi */
      desa: b.kelurahan,
      kelurahan: b.kelurahan,
      kecamatan: b.kecamatan,
      rt_rw: b.rt_rw,

      /* Luas */
      luas_m2: b.luas_tnh,
      luas_tnh: b.luas_tnh,
      luastertul: b.luastertul,
      luaspeta: b.luaspeta,
      luas_terdampak_m2:
        b.luas_terdampak_m2,
      luas_sisa_m2:
        b.luas_sisa_m2,

      /* Geometri */
      sumbergeom: b.sumbergeom,
      shape_leng: b.shape_leng,
      shape_area: b.shape_area,

      /* Penggunaan */
      penggunaan: b.penggunaan,

      /* Legalitas */
      tipehak: b.tipehak,
      tipeproduk: b.tipeproduk,
      nib: b.nib,
      sta_tnh: b.sta_tnh,
      surat_hak: b.surat_hak,
      nomor_hak: b.nomor_hak,
      alas_hak: b.alas_hak,
      beban_hak: b.beban_hak,

      /* Pengukuran */
      tahun: b.tahun,
      alatukur: b.alatukur,
      metodukur: b.metodukur,

      /* Pemilik */
      pemilik: b.nama_milik
        ? [
            {
              id: String(b.id),
              urutan: 1,
              nama: b.nama_milik,
              ttl: b.ttl_milik,
              pekerjaan: b.krja_milik,
              alamat: b.almt_milik,
              nik: b.nik_milik,
              telepon: null,
              hubungan: null,
              npwp: null,
              bank_nama: null,
              bank_rek: null
            }
          ]
        : [],

      nama_milik: b.nama_milik,
      ttl_milik: b.ttl_milik,
      krja_milik: b.krja_milik,
      almt_milik: b.almt_milik,
      nik_milik: b.nik_milik,

      /* Penyewa / penggarap */
      nama_sewa: b.nama_sewa,
      ttl_sewa: b.ttl_sewa,
      krja_sewa: b.krja_sewa,
      almt_sewa: b.almt_sewa,
      nik_sewa: b.nik_sewa,
      nomor_hp: b.nomor_hp,

      penyewa: b.nama_sewa
        ? [
            {
              id: String(b.id),
              urutan: 1,
              nama: b.nama_sewa,
              ttl: b.ttl_sewa,
              pekerjaan: b.krja_sewa,
              alamat: b.almt_sewa,
              nik: b.nik_sewa,
              telepon: b.nomor_hp,
              hubungan: null,
              npwp: null,
              bank_nama: null,
              bank_rek: null
            }
          ]
        : [],

      /* Tanah */
      hub_tnh: b.hub_tnh,
      kode_wwc: b.kode_wwc,
      jenis_tnh: b.jenis_tnh,

      ruang_atbt: b.ruang_atbt,
      luas_atbt: b.luas_atbt,

      dampak_tnh: b.dampak_tnh,

      /* Bangunan
       * Database hanya menyimpan jumlah.
       * Tidak membuat objek bangunan palsu.
       */
      jml_bgn: b.jml_bgn,
      bangunan: [],

      /* Tanaman */
      jenis_tnm: b.jenis_tnm,
      jumlah_tnm: b.jumlah_tnm,

      /* Benda lain */
      jenis_bnd: b.jenis_bnd,
      jumlah_bnd: b.jumlah_bnd,

      /* Foto */
      foto_tnh: b.foto_tnh,
      path: b.path,

      /* Metadata */
      nama: b.nama,
      layer: b.layer,
      date_updt: b.date_updt,
      created_at: b.created_at,

      /* Workflow */
      status: b.status,
      catatan_supervisor:
        b.catatan_supervisor,
      petugas_nama:
        b.petugas_nama,
      tanggal_ukur:
        b.tanggal_ukur,
      dikirim_pada:
        b.dikirim_pada,
      diverifikasi_pada:
        b.diverifikasi_pada,

      /*
       * Lampiran dan riwayat belum berasal
       * dari tabel bidang_tanah.
       */
      lampiran: [],
      riwayat: []
    };

    return NextResponse.json(bidang);

  } catch (error) {
    console.error(
      'GET /api/bidang/[id] ERROR:',
      error
    );

    return NextResponse.json(
      {
        pesan:
          'Gagal memuat data bidang',
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   PATCH SCHEMA
   HANYA kolom yang benar-benar ada di
   public.bidang_tanah
   ========================================================= */

const SkemaUbah = z.object({

  /* Lokasi */
  kecamatan:
    z.string().max(120).nullish(),

  kelurahan:
    z.string().max(120).nullish(),

  rt_rw:
    z.string().max(120).nullish(),

  kodewilaya:
    z.string().max(120).nullish(),

  kode_bid:
    z.string().max(120).nullish(),


  /* Legalitas */
  tipehak:
    z.string().max(120).nullish(),

  tipeproduk:
    z.string().max(120).nullish(),

  nib:
    z.string().max(100).nullish(),

  tahun:
    tahunOpsional,

  surat_hak:
    z.string().max(160).nullish(),

  nomor_hak:
    z.string().max(160).nullish(),

  alas_hak:
    z.string().max(160).nullish(),

  beban_hak:
    z.string().max(160).nullish(),


  /* Penggunaan */
  penggunaan:
    z.string().max(120).nullish(),

  hub_tnh:
    z.string().max(120).nullish(),

  sta_tnh:
    z.string().max(120).nullish(),

  dampak_tnh:
    z.string().max(160).nullish(),


  /* Pengukuran */
  alatukur:
    z.string().max(120).nullish(),

  metodukur:
    z.string().max(120).nullish(),

  luas_tnh:
    angkaOpsional,

  luas_atbt:
    angkaOpsional,

  ruang_atbt:
    z.string().max(120).nullish(),


  /* Pemilik */
  nama_milik:
    z.string().max(160).nullish(),

  ttl_milik:
    z.string().max(160).nullish(),

  krja_milik:
    z.string().max(120).nullish(),

  almt_milik:
    z.string().max(240).nullish(),

  nik_milik:
    z.string().max(32).nullish(),


  /* Penyewa */
  nama_sewa:
    z.string().max(160).nullish(),

  ttl_sewa:
    z.string().max(160).nullish(),

  krja_sewa:
    z.string().max(120).nullish(),

  almt_sewa:
    z.string().max(240).nullish(),

  nik_sewa:
    z.string().max(32).nullish(),

  nomor_hp:
    z.string().max(40).nullish(),


  /* Tanaman */
  jenis_tnm:
    z.string().max(160).nullish(),

  jumlah_tnm:
    angkaOpsional,


  /* Benda lain */
  jenis_bnd:
    z.string().max(160).nullish(),

  jumlah_bnd:
    angkaOpsional,


  /* Bangunan */
  jml_bgn:
    angkaOpsional,


  /* Luas dampak
   * Bisa dipakai jika nantinya KartuBidang
   * menjadikannya editable.
   */
  luas_terdampak_m2:
    angkaOpsional,

  luas_sisa_m2:
    angkaOpsional,


  /* Metadata */
  date_updt:
    z.string().nullish()
});


/* =========================================================
   PATCH
   ========================================================= */

export async function PATCH(
  req: Request,
  { params }: Ctx
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse(
      'Belum masuk',
      { status: 401 }
    );
  }

  const { id } = await params;

  try {

    /* =====================================================
       CEK BIDANG
       ===================================================== */

    const [row] =
      await query<{
        status: StatusBidang;
      }>(
        `
        SELECT status
        FROM public.bidang_tanah
        WHERE id = $1
        `,
        [id]
      );

    if (!row) {
      return new NextResponse(
        'Bidang tidak ditemukan',
        { status: 404 }
      );
    }


    /* =====================================================
       CEK RBAC
       ===================================================== */

    if (
      !dapatMengubahAtribut(
        sesi.user.peran,
        row.status
      )
    ) {
      return new NextResponse(
        'Bidang terkunci untuk peran ini',
        { status: 403 }
      );
    }


    /* =====================================================
       VALIDASI BODY
       ===================================================== */

    const parsed =
      SkemaUbah.safeParse(
        await req.json()
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          pesan:
            'Data tidak valid',
          detail:
            parsed.error.flatten()
        },
        { status: 400 }
      );
    }


    /* =====================================================
       AMBIL FIELD YANG DIKIRIM
       ===================================================== */

    const isi =
      Object.entries(parsed.data)
        .filter(
          ([, value]) =>
            value !== undefined
        );

    if (!isi.length) {
      return NextResponse.json({
        ok: true
      });
    }


    /* =====================================================
       TRANSAKSI
       ===================================================== */

    await transaksi(
      sesi.user.id,
      async (c) => {

        /* ===============================================
           AMBIL NILAI LAMA
           =============================================== */

        const [lama] =
          await c.query<any>(
            `
            SELECT *
            FROM public.bidang_tanah
            WHERE id = $1
            FOR UPDATE
            `,
            [id]
          );

        if (!lama) {
          throw new Error(
            'Bidang tidak ditemukan'
          );
        }


        /* ===============================================
           UPDATE
           =============================================== */

        const set =
          isi
            .map(
              ([kolom], index) =>
                `${kolom} = $${index + 2}`
            )
            .join(', ');

        await c.query(
          `
          UPDATE public.bidang_tanah
          SET ${set}
          WHERE id = $1
          `,
          [
            id,
            ...isi.map(
              ([, value]) =>
                value
            )
          ]
        );


        /* ===============================================
           AUDIT LOG
           HANYA FIELD YANG BERUBAH
           =============================================== */

        for (
          const [kolom, nilaiBaru]
          of isi
        ) {

          const nilaiLama =
            lama[kolom];

          const lamaText =
            nilaiLama == null
              ? null
              : String(nilaiLama);

          const baruText =
            nilaiBaru == null
              ? null
              : String(nilaiBaru);

          if (
            lamaText === baruText
          ) {
            continue;
          }

          await c.query(
            `
            INSERT INTO public.audit_log (
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
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              NOW()
            )
            `,
            [
              'bidang_tanah',
              id,
              lama.bidang_id ??
                null,
              'UPDATE',
              kolom,
              lamaText,
              baruText,
              sesi.user.id
            ]
          );
        }
      }
    );


    /* =====================================================
       BERHASIL
       ===================================================== */

    return NextResponse.json({
      ok: true
    });

  } catch (error) {

    console.error(
      'PATCH /api/bidang/[id] ERROR:',
      error
    );

    return NextResponse.json(
      {
        pesan:
          'Gagal memperbarui bidang',
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      { status: 500 }
    );
  }
}
