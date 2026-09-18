// ============================================================================
// Konfigurasi langkah tur & pop-up bantuan — WebGIS DPPT Bojonegoro
// Tiap langkah menargetkan sebuah elemen lewat `selector` (data-guide="...").
// Tambahkan atribut data-guide pada elemen terkait di komponen Anda.
// ============================================================================

export type GuideStep = {
  id: string;
  selector: string;            // elemen yang disorot (data-guide=...)
  title: string;
  body: string;
  place?: "top" | "bottom" | "left" | "right"; // arah pop-up (default: auto)
};

// Tur bertahap — urut sesuai alur pengenalan aplikasi.
export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "welcome",
    selector: '[data-guide="app-title"]',
    title: "Selamat datang di SIPETAK Bojonegoro",
    body: "Portal pemetaan bidang tanah terdampak trase jalan. Ikuti tur singkat ini untuk mengenal fitur utamanya, atau lewati kapan saja.",
    place: "bottom",
  },
  {
    id: "basemap",
    selector: '[data-guide="basemap"]',
    title: "Peta Dasar (Basemap)",
    body: "Ganti latar peta: citra satelit, peta jalan, topografi, atau orthophoto resolusi tinggi DPPT Bojonegoro 2026.",
    place: "right",
  },
  {
    id: "terrain",
    selector: '[data-guide="terrain"]',
    title: "Terrain 3D",
    body: "Aktifkan relief permukaan: AWS Terrarium (global 30 m) untuk konteks, atau DTM 3 m hasil pengukuran untuk detail. Default nonaktif.",
    place: "right",
  },
  {
    id: "layer",
    selector: '[data-guide="layer"]',
    title: "Panel Layer",
    body: "Nyalakan/matikan layer tematik (bidang tanah, trase, batas administrasi, dll) sesuai kebutuhan analisis. Legenda mengikuti layer aktif.",
    place: "right",
  },
  {
    id: "daftar-bidang",
    selector: '[data-guide="daftar-bidang"]',
    title: "Daftar Bidang",
    body: "Telusuri seluruh bidang tanah terdata. Klik satu bidang untuk melihat detail, kelengkapan berkas, dan menyorotnya di peta.",
    place: "right",
  },
  {
    id: "analisis-kepemilikan",
    selector: '[data-guide="analisis-kepemilikan"]',
    title: "Analisis Kepemilikan",
    body: "Ringkasan status kepemilikan bidang — memudahkan meninjau progres pendataan dan verifikasi.",
    place: "right",
  },
  {
    id: "statistika",
    selector: '[data-guide="statistika"]',
    title: "Statistika",
    body: "Rekapitulasi angka: jumlah bidang, luas, kelengkapan berkas, dan indikator lain dalam bentuk ringkas.",
    place: "right",
  },
  {
    id: "filter",
    selector: '[data-guide="filter"]',
    title: "Filter",
    body: "Saring bidang berdasarkan kriteria tertentu (status, kelengkapan, wilayah) agar peta menampilkan hanya yang relevan.",
    place: "right",
  },
  {
    id: "pencarian",
    selector: '[data-guide="pencarian"]',
    title: "Pencarian",
    body: "Cari bidang, pemilik, atau lokasi dengan cepat lalu langsung melompat ke posisinya di peta.",
    place: "right",
  },
  {
    id: "riwayat-aksi",
    selector: '[data-guide="riwayat-aksi"]',
    title: "Riwayat Aksi",
    body: "Jejak audit — siapa mengubah apa dan kapan. Membantu menelusuri perubahan data secara transparan.",
    place: "right",
  },
  {
    id: "tema",
    selector: '[data-guide="tema"]',
    title: "Tema Terang/Gelap",
    body: "Ganti tampilan antara mode terang dan gelap sesuai kenyamanan, terutama saat kerja lapangan siang/malam.",
    place: "bottom",
  },
  {
    id: "pengguna",
    selector: '[data-guide="pengguna"]',
    title: "Akun Pengguna",
    body: "Menampilkan nama dan peran Anda. Fitur yang tersedia menyesuaikan peran (supervisor, pendata, pelihat, pengembang).",
    place: "bottom",
  },
  {
    id: "signout",
    selector: '[data-guide="signout"]',
    title: "Keluar",
    body: "Akhiri sesi dengan aman setelah selesai bekerja.",
    place: "bottom",
  },
  {
    id: "zoom",
    selector: '[data-guide="map-zoom"]',
    title: "Navigasi Peta",
    body: "Perbesar/perkecil peta dan gunakan kompas untuk mengatur arah serta kemiringan tampilan 3D.",
    place: "left",
  },
  {
    id: "status",
    selector: '[data-guide="map-status"]',
    title: "Informasi Peta",
    body: "Baris bawah menampilkan koordinat kursor, skala (scale bar), dan nama basemap yang sedang aktif.",
    place: "top",
  },
];

// Pop-up kecil per fitur (ikon i / hover) — teks ringkas, dipetakan per id fitur.
export const GUIDE_TIPS: Record<string, { title: string; body: string }> = Object.fromEntries(
  GUIDE_STEPS.map((s) => [s.id, { title: s.title, body: s.body }])
);
