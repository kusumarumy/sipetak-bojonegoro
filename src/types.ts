export type Peran = 'pendata' | 'supervisor' | 'pelihat' | 'pengembang';
export type StatusBidang = 'draft' | 'terkirim' | 'terverifikasi' | 'revisi';

export type KategoriLampiran =
  | 'foto_bidang'
  | 'foto_bangunan_depan'
  | 'foto_pemilik_petugas';

export const KATEGORI_LABEL: Record<KategoriLampiran, string> = {
  foto_bidang: 'Bidang tanah',
  foto_bangunan_depan: 'Bangunan tampak depan',
  foto_pemilik_petugas: 'Pemilik & petugas'
};

export const WAJIB: KategoriLampiran[] = [
  'foto_bidang',
  'foto_bangunan_depan',
  'foto_pemilik_petugas'
];

export interface Pemilik {
  id: string; urutan: number; nama: string; nik: string | null;
  alamat: string | null; telepon: string | null; pekerjaan: string | null;
  hubungan: string | null; npwp: string | null;
  bank_nama: string | null; bank_rek: string | null;
}
export interface Bangunan {
  id: string; jenis: string | null; konstruksi: string | null;
  luas_lantai_m2: number | null; jumlah_lantai: number | null;
  atap: string | null; dinding: string | null; lantai_bahan: string | null;
  tahun_dibangun: number | null; kondisi: string | null;
  tingkat_terdampak: string | null;
  listrik: string | null; air: string | null; sanitasi: string | null;
}
export interface Lampiran {
  id: string; kategori: KategoriLampiran; nama_asli: string | null;
  mime: string | null; ukuran_byte: number | null;
  lat: number | null; lon: number | null; diambil_pada: string | null;
  sensitif: boolean; diunggah_pada: string; diunggah_oleh_nama: string | null;
}
export interface JejakAudit {
  id: number; aksi: string; kolom: string | null;
  nilai_lama: string | null; nilai_baru: string | null;
  pada: string; oleh: string | null;
}
export interface Bidang {
  // Identitas
  id: string;
  objectid?: number | null;
  bidang_id?: string | null;
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
  alas_hak?: string | null;
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

  // Metadata
  date_updt?: string | null;
  foto_tnh?: string | null;
  nama?: string | null;
  layer?: string | null;
  path?: string | null;
  geometry?: unknown;
  created_at?: string | null;

  // Status aplikasi
  status: StatusBidang;
  catatan_supervisor: string | null;
  petugas_nama: string | null;
  tanggal_ukur: string | null;
  dikirim_pada: string | null;
  diverifikasi_pada: string | null;

  // Relasi aplikasi
  pemilik: Pemilik[];
  bangunan: Bangunan[];
  lampiran: Lampiran[];
  riwayat: JejakAudit[];
}
