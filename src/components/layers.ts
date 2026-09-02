/**
 * Definisi seluruh layer peta di satu tempat: sumber data, warna, dan urutan.
 * MapCanvas membaca berkas ini; panel layer juga. Menambah layer baru cukup
 * menambah satu baris di sini.
 */
export type DefLayer = {
  id: string;
  nama: string;
  sumber: string;            // nama endpoint /api/layers/<sumber>
  tipe: 'fill' | 'line' | 'circle';
  warna: string;
  garis?: boolean;           // tampilkan sebagai contoh garis di legenda
  lebar?: number;
  dash?: number[];
  opasitas?: number;
  bawaan?: boolean;          // aktif saat aplikasi dibuka
  grup: string;
};

export const LAYERS: DefLayer[] = [
  { id: 'aoi_trace', nama: 'AOI trace (ROW 26 m)', sumber: 'aoi_trace', tipe: 'fill',
    warna: '#A79BEB', opasitas: 0.16, bawaan: true, grup: 'Rencana trace' },
  { id: 'trace', nama: 'As jalan rencana', sumber: 'trace', tipe: 'line',
    warna: '#93A3B3', garis: true, lebar: 2, dash: [4, 2], bawaan: true, grup: 'Rencana trace' },

  { id: 'sawah', nama: 'Sawah', sumber: 'sawah', tipe: 'fill', warna: '#6FC7A4', opasitas: 0.42, grup: 'Tutupan lahan' },
  { id: 'hutan', nama: 'Hutan', sumber: 'hutan', tipe: 'fill', warna: '#2C7F6B', opasitas: 0.5, grup: 'Tutupan lahan' },
  { id: 'permukiman', nama: 'Permukiman', sumber: 'permukiman', tipe: 'fill', warna: '#E0708F', opasitas: 0.42, grup: 'Tutupan lahan' },
  { id: 'makam', nama: 'Makam', sumber: 'makam', tipe: 'fill', warna: '#9B87D4', opasitas: 0.6, grup: 'Tutupan lahan' },

  { id: 'jalan', nama: 'Jalan eksisting', sumber: 'jalan', tipe: 'line', warna: '#9FB0BE', garis: true, lebar: 1.8, grup: 'Jaringan & utilitas' },
  { id: 'rel_ka', nama: 'Rel kereta api', sumber: 'rel_ka', tipe: 'line', warna: '#93A3B3', garis: true, lebar: 2, dash: [2, 2], grup: 'Jaringan & utilitas' },
  { id: 'sungai', nama: 'Sungai', sumber: 'sungai', tipe: 'line', warna: '#4C87B8', garis: true, lebar: 3.4, grup: 'Jaringan & utilitas' },
  { id: 'sutet', nama: 'Jaringan SUTET', sumber: 'sutet', tipe: 'line', warna: '#9ED45E', garis: true, lebar: 1.7, dash: [6, 3], grup: 'Jaringan & utilitas' },
  { id: 'sutet_titik', nama: 'Titik tower SUTET', sumber: 'sutet_titik', tipe: 'circle', warna: '#9ED45E', grup: 'Jaringan & utilitas' },
  { id: 'pipa_exxon', nama: 'Pipa Exxon', sumber: 'pipa_exxon', tipe: 'line', warna: '#3FBFB0', garis: true, lebar: 2.3, dash: [5, 2], grup: 'Jaringan & utilitas' },
  { id: 'pipa_gresik_semarang', nama: 'Pipa Gresik–Semarang', sumber: 'pipa_gresik_semarang', tipe: 'line', warna: '#C77DD4', garis: true, lebar: 2.3, dash: [5, 2], grup: 'Jaringan & utilitas' }
];

/** Kontur disajikan dari PMTiles, bukan GeoJSON — jumlah simpulnya terlalu besar. */
export const KONTUR = {
  lidar: { id: 'kontur_lidar', nama: 'Kontur LiDAR', warna: '#B4A7EE', url: process.env.NEXT_PUBLIC_TILES_KONTUR_LIDAR },
  foto:  { id: 'kontur_foto',  nama: 'Kontur foto udara', warna: '#7FCFD6', url: process.env.NEXT_PUBLIC_TILES_KONTUR_FOTO }
};

export const DTM = {
  lidar: process.env.NEXT_PUBLIC_TILES_DTM_LIDAR,
  foto:  process.env.NEXT_PUBLIC_TILES_DTM_FOTO
};

export const ORTHO = process.env.NEXT_PUBLIC_TILES_ORTHO;

export const WARNA_PENGGUNAAN: Record<string, string> = {
  'Sawah': '#6FC7A4', 'Tegalan': '#8FBFD9', 'Pekarangan': '#B49BE5',
  'Permukiman': '#E0708F', 'Kebun': '#3D9E86', 'Tambak': '#5E8FD0', 'Tanah kosong': '#93A3B3'
};
