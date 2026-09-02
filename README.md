# WebGIS DPPT Bojonegoro

Pendataan bidang tanah terdampak trace jalan 19 km, ROW 26 m, ±950 bidang.
Dokumen perencanaan pengadaan tanah, Kabupaten Bojonegoro.

## Susunan

| Lapisan | Pilihan |
|---|---|
| Antarmuka | Next.js 15 (App Router) · TypeScript · MapLibre GL JS · Zustand |
| Server | API Route Next.js — satu repo, tanpa service terpisah |
| Basis data | PostgreSQL + PostGIS |
| Masuk | Auth.js v5, credentials, peran di JWT |
| Foto & dokumen | Cloudflare R2, bucket privat, unggah lewat presigned URL |
| Ortho / DTM / kontur | PMTiles di R2 |

Bidang tanah disajikan sebagai GeoJSON dari database, bukan vector tile: 950
poligon itu ringan, dan hasil edit langsung tampil tanpa tiling ulang. Yang berat
dan tidak berubah — ortho, DTM, kontur — barulah lewat PMTiles.

## Menjalankan

```bash
cp .env.example .env          # isi DATABASE_URL, AUTH_SECRET, kredensial R2
npm install
npm run db:schema             # membuat tabel, view, trigger audit
npm run user:add -- tirta.wp "Tirta W. P." pengembang
npm run dev
```

## Memasukkan data

Sesuaikan dulu `PETA_KOLOM` di `scripts/import-geojson.ts` dengan nama atribut
di GeoJSON dari tim lapangan, lalu:

```bash
npm run import -- bidang      data/bidang.geojson
npm run import -- layer:trace data/trace.geojson
npm run import -- layer:aoi_trace data/aoi.geojson
npm run import -- layer:sawah data/tutupan_sawah.geojson
npm run import -- layer:hutan data/tutupan_hutan.geojson
npm run import -- layer:permukiman data/tutupan_permukiman.geojson
npm run import -- layer:makam data/makam.geojson
npm run import -- layer:sungai data/sungai.geojson
npm run import -- layer:rel_ka data/rel_ka.geojson
npm run import -- layer:jalan data/jalan.geojson
npm run import -- layer:sutet data/sutet.geojson
npm run import -- layer:sutet_titik data/sutet_titik.geojson
npm run import -- layer:pipa_exxon data/pipa_exxon.geojson
npm run import -- layer:pipa_gresik_semarang data/pipa_gs.geojson
```

Impor bidang bersifat upsert berdasarkan nomor bidang, jadi aman diulang setiap
kali tim lapangan mengirim pembaruan. Impor layer statis mengganti isi layer itu
sepenuhnya.

Kontur **tidak** diimpor ke database — lihat `scripts/tiling.md`.

## Alur verifikasi

```
draft ──kirim──▶ terkirim ──setujui──▶ terverifikasi
  ▲                  │                        │
  └──── revisi ◀─────┘◀───────koreksi─────────┘
```

Aturannya di `src/lib/rbac.ts`, satu berkas, dipakai server dan klien:

- **Pendata** mengubah data hanya saat status draft atau revisi. Begitu dikirim, terkunci.
- **Supervisor** memeriksa; menyetujui atau mengembalikan dengan catatan wajib.
- **Pelihat** membaca saja, dan tidak menerima NIK maupun berkas KTP/KK/sertipikat — ditolak di server, bukan disembunyikan di CSS.
- **Pengembang** akses penuh, termasuk mengoreksi bidang yang sudah terverifikasi.

Bidang tidak bisa dikirim sebelum lima berkas wajib ada: foto bidang, foto patok,
foto pemilik bersama petugas, KTP, dan berita acara.

## Jejak audit

Trigger `catat_audit()` di database mencatat setiap kolom yang berubah pada
bidang, pemilik, dan bangunan — nilai lama, nilai baru, pelaku, waktu. Identitas
pelaku dipasang lewat `app.pengguna_id` di setiap transaksi (`src/lib/db.ts`),
jadi tidak ada jalur tulis yang bisa lolos dari pencatatan. Untuk data pengadaan
tanah yang bisa disengketakan, ini bukan fitur tambahan.

## Data pribadi

Berkas berisi KTP, KK, dan sertipikat tunduk pada UU 27/2022. Yang sudah dipasang:

- Bucket R2 privat; berkas dibuka lewat tautan bertanda tangan berumur 5 menit
- Berkas sensitif ditandai otomatis oleh trigger, dan ditolak untuk peran pelihat di sisi server
- NIK tidak ikut dikirim ke klien untuk peran yang tidak berhak
- `noindex`, `Referrer-Policy: same-origin`, sesi 8 jam

Yang masih perlu disepakati dengan PT Total Geo Survey: berapa lama berkas
disimpan setelah proyek selesai, dan siapa yang menghapusnya.

## Yang belum dikerjakan

- Tabel daftar bidang di bawah peta (prototipe punya, versi ini belum)
- Cetak kartu bidang ke PDF
- Halaman kelola pengguna untuk peran pengembang
- Mode luring untuk pengisian langsung di lapangan — belum perlu selama entri
  dilakukan di kantor. Kalau nanti berubah, butuh PWA dengan antrean IndexedDB,
  dan itu pekerjaan tersendiri.
