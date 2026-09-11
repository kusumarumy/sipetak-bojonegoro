export type Peran = 'pendata' | 'supervisor' | 'pelihat' | 'pengembang';
export type StatusBidang = 'draft' | 'terkirim' | 'terverifikasi' | 'revisi';

export const STATUS_LABEL: Record<StatusBidang, string> = {
  draft: 'Draft',
  terkirim: 'Menunggu verifikasi',
  terverifikasi: 'Terverifikasi',
  revisi: 'Perlu revisi'
};

export const STATUS_WARNA: Record<StatusBidang, string> = {
  draft: '#93A3B3',
  terkirim: '#66B3E5',
  terverifikasi: '#4FC49E',
  revisi: '#E0708F'
};

export type KategoriLampiran =
  | 'foto_bidang' | 'foto_bangunan_depan' | 'foto_bangunan_kiri' | 'foto_bangunan_kanan'
  | 'foto_bangunan_belakang' | 'foto_patok' | 'foto_tanaman' | 'foto_benda_lain'
  | 'foto_akses' | 'foto_pemilik_petugas'
  | 'dok_ktp' | 'dok_kk' | 'dok_sertipikat' | 'dok_sppt' | 'dok_ahli_waris'
  | 'dok_kuasa' | 'dok_rekening' | 'dok_berita_acara' | 'lainnya';

export const KATEGORI_LABEL: Record<KategoriLampiran, string> = {
  foto_bidang: 'Bidang tanah',
  foto_bangunan_depan: 'Bangunan tampak depan',
  foto_bangunan_kiri: 'Tampak samping kiri',
  foto_bangunan_kanan: 'Tampak samping kanan',
  foto_bangunan_belakang: 'Tampak belakang',
  foto_patok: 'Patok batas',
  foto_tanaman: 'Tanaman tumbuh',
  foto_benda_lain: 'Benda lain di atas tanah',
  foto_akses: 'Akses jalan',
  foto_pemilik_petugas: 'Pemilik & petugas',
  dok_ktp: 'KTP pemilik',
  dok_kk: 'Kartu keluarga',
  dok_sertipikat: 'Sertipikat / Letter C',
  dok_sppt: 'SPPT PBB',
  dok_ahli_waris: 'Surat ahli waris',
  dok_kuasa: 'Surat kuasa',
  dok_rekening: 'Buku rekening',
  dok_berita_acara: 'Berita acara pendataan',
  lainnya: 'Lainnya'
};

export const WAJIB: KategoriLampiran[] = [
  'foto_bidang', 'foto_patok', 'foto_pemilik_petugas', 'dok_ktp', 'dok_berita_acara'
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
export interface Tanaman { id: string; jenis: string; jumlah: number | null; satuan: string | null; keterangan: string | null; }
export interface BendaLain { id: string; jenis: string; ukuran: string | null; jumlah: number | null; keterangan: string | null; }
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
  // =========================
  // IDENTITAS BIDANG
  // =========================
  id: string;
  objectid?: number | null;
  bidang_id?: string | null;
  kode?: string | null;
  kode_bid?: string | null;
  fid?: string | null;

  // =========================
  // WILAYAH
  // =========================
  kodewilaya?: string | null;
  kecamatan: string | null;
  kelurahan?: string | null;
  desa?: string | null;
  rt_rw?: string | null;

  // =========================
  // HAK / PRODUK
  // =========================
  tipehak?: string | null;
  tipeproduk?: string | null;
  tahun?: number | null;
  nib: string | null;

  surat_hak?: string | null;
  nomor_hak?: string | null;
  alas_hak?: string | null;
  beban_hak?: string | null;

  // =========================
  // LUAS
  // =========================
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

  // =========================
  // PENGUKURAN
  // =========================
  alatukur?: string | null;
  metodukur?: string | null;

  // =========================
  // PENGGUNAAN / TANAH
  // =========================
  penggunaan: string | null;
  hub_tnh?: string | null;
  kode_wwc?: string | null;
  jenis_tnh?: string | null;
  ruang_atbt?: string | null;

  sta_tnh?: string | null;
  dampak_tnh?: string | null;

  // =========================
  // PEMILIK — DATA LANGSUNG
  // =========================
  nama_milik?: string | null;
  ttl_milik?: string | null;
  krja_milik?: string | null;
  almt_milik?: string | null;
  nik_milik?: string | null;

  nomor_hp?: string | null;

  // =========================
  // PENYEWA
  // =========================
  nama_sewa?: string | null;
  ttl_sewa?: string | null;
  krja_sewa?: string | null;
  almt_sewa?: string | null;
  nik_sewa?: string | null;

  // =========================
  // TANAMAN
  // =========================
  jenis_tnm?: string | null;
  jumlah_tnm?: number | null;

  // =========================
  // BENDA LAIN
  // =========================
  jenis_bnd?: string | null;
  jumlah_bnd?: number | null;

  // =========================
  // BANGUNAN
  // =========================
  jml_bgn?: number | null;

  // =========================
  // DATA LAIN
  // =========================
  date_updt?: string | null;
  foto_tnh?: string | null;
  nama?: string | null;
  layer?: string | null;
  path?: string | null;

  // =========================
  // GEOMETRY
  // =========================
  geometry?: unknown;

  // =========================
  // STATUS APLIKASI
  // =========================
  status: StatusBidang;
  catatan_supervisor: string | null;

  petugas_nama: string | null;
  tanggal_ukur: string | null;
  dikirim_pada: string | null;
  diverifikasi_pada: string | null;

  created_at?: string | null;

  // =========================
  // RELASI APLIKASI
  // =========================
  pemilik: Pemilik[];
  bangunan: Bangunan[];
  tanaman: Tanaman[];
  benda_lain: BendaLain[];
  lampiran: Lampiran[];
  riwayat: JejakAudit[];
}
