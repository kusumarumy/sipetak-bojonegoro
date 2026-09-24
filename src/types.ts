export type Peran = 'pendata' | 'supervisor' | 'pelihat' | 'pengembang';
export type StatusBidang = 'draft' | 'terkirim' | 'terverifikasi' | 'revisi';

export type KategoriLampiran =
  | 'foto_bidang'
  | 'foto_bangunan_depan'
  | 'foto_pemilik_petugas';

export const KATEGORI_LABEL: Record<KategoriLampiran, string> = {
  foto_bidang: 'Bidang Tanah',
  foto_bangunan_depan: 'Bangunan',
  foto_pemilik_petugas: 'Pemilik & Petugas'
};

export const WAJIB: KategoriLampiran[] = [
  'foto_bidang',
  'foto_pemilik_petugas'
];

/* =========================
   PILIHAN DROPDOWN
   ========================= */

export const PILIHAN_BIDANG = {
  hub_tnh: [
    'Ditempati Pemilik Bidang Tanah',
    'Disewakan',
    'Sebagai Pemilik (Tidak Menempati)',
    'Tidak Jelas'
  ],

  kode_wwc: [
    'Bisa Ditemui',
    'Tidak Bisa Ditemui',
    'Diwakilkan Pendamping',
    'Tidak Bersedia Didata'
  ],

  jenis_tnh: [
    'Tanah & Bangunan',
    'Kavling Siap Bangun',
    'Tanah Kosong',
    'Tanah Pertanian',
    'Fasilitas Umum',
    'Milik Pemerintah',
    'Tidak Diketahui'
  ],

  kode_bid: [
    'Sudah Tepat',
    'Perubahan Batas (Redelineasi)',
    'Pemecahan Bidang Tanah',
    'Penggabungan Bidang Tanah',
    'Sengketa'
  ],

  sta_tnh: [
    'Hak Milik',
    'Hak Guna Usaha',
    'Hak Guna Bangunan',
    'Hak Pengelolaan',
    'Tanah Negara',
    'Tanah Kas Desa (TKD)',
    'Hak Wakaf',
    'Tanah Bukti tertulis hak lama',
    'Tidak Diketahui'
  ],

  surat_hak: [
    'Sertipikat',
    'Girik',
    'Letter C',
    'Akta jual beli',
    'Lainnya'
  ],

  jenis_tnm: [
    'Tahunan',
    'Musiman',
    'Tidak Diketahui'
  ],

  beban_hak: [
    'Milik Pemerintah Kabupaten',
    'Milik Privat',
    'Tidak Diketahui'
  ],

  dampak_tnh: [
    'Terkena seluruhnya',
    'Terkena sebagian',
    'Lainnya'
  ]
} as const;

export interface Pemilik {
  id: string;
  urutan: number;
  nama: string;
  nik: string | null;
  alamat: string | null;
  telepon: string | null;
  pekerjaan: string | null;
  hubungan: string | null;
  npwp: string | null;
  bank_nama: string | null;
  bank_rek: string | null;
}

export interface Bangunan {
  id: string;
  jenis: string | null;
  konstruksi: string | null;
  luas_lantai_m2: number | null;
  jumlah_lantai: number | null;
  atap: string | null;
  dinding: string | null;
  lantai_bahan: string | null;
  tahun_dibangun: number | null;
  kondisi: string | null;
  tingkat_terdampak: string | null;
  listrik: string | null;
  air: string | null;
  sanitasi: string | null;
}

export interface Lampiran {
  id: string;
  kategori: KategoriLampiran;
  nama_asli: string | null;
  mime: string | null;
  ukuran_byte: number | null;
  lat: number | null;
  lon: number | null;
  diambil_pada: string | null;
  sensitif: boolean;
  diunggah_pada: string;
  diunggah_oleh_nama: string | null;
}

export interface JejakAudit {
  id: number;
  aksi: string;
  kolom: string | null;
  nilai_lama: string | null;
  nilai_baru: string | null;
  pada: string;
  oleh: string | null;
}

export interface Bidang {
  // Identitas
  id: string;
  objectid?: number | null;
  kode?: string | null;
  kode_bid?: string | null;
  fid?: string | null;

  // Wilayah
  kodewilaya?: string | null;
  kecamatan: string | null;
  kelurahan?: string | null;
  desa?: string | null;
  rt_rw?: string | null;

  // Hak / produk
  tipehak?: string | null;
  tipeproduk?: string | null;
  tahun?: number | null;
  nib: string | null;
  surat_hak?: string | null;
  nomor_hak?: string | null;
  beban_hak?: string | null;

  // Luas
  luastertul?: number | null;
  luaspeta?: number | null;
  luas_m2?: number | null;
  luas_tnh?: number | null;
  luas_atbt?: number | null;
  luas_terdampak_m2?: number | null;
  luas_sisa_m2?: number | null;
  sumbergeom?: number | null;
  shape_leng?: number | null;
  shape_area?: number | null;

  // Pengukuran
  alatukur?: string | null;
  metodukur?: string | null;

  // Tanah
  penggunaan: string | null;
  hub_tnh?: string | null;
  kode_wwc?: string | null;
  jenis_tnh?: string | null;
  ruang_atbt?: string | null;
  sta_tnh?: string | null;
  dampak_tnh?: string | null;

  // Pemilik langsung dari tabel bidang_tanah
  nama_milik?: string | null;
  ttl_milik?: string | null;
  krja_milik?: string | null;
  almt_milik?: string | null;
  nik_milik?: string | null;
  nomor_hp?: string | null;

  // Penyewa
  nama_sewa?: string | null;
  ttl_sewa?: string | null;
  krja_sewa?: string | null;
  almt_sewa?: string | null;
  nik_sewa?: string | null;

  // Bangunan
  jml_bgn?: number | null;

  // Tanaman / benda
  jenis_tnm?: string | null;
  jumlah_tnm?: number | null;
  jenis_bnd?: string | null;
  jumlah_bnd?: number | null;

  // Metadata
  date_updt?: string | null;
  foto_tnh?: string | null;
  foto_wwc?: string | null;
  keterangan?: string | null;
  geometry?: unknown;
  created_at?: string | null;

// Status aplikasi
status: StatusBidang;
cat_spv?: string | null;
verif_at?: string | null;

  // Relasi aplikasi
  pemilik: Pemilik[];
  bangunan: Bangunan[];
  lampiran: Lampiran[];
  riwayat: JejakAudit[];
}
