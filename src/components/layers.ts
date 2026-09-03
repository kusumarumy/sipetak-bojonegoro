export type DefLayer = {
  id: string;
  nama: string;
  sumber: string;          
  tipe: 'fill' | 'line' | 'circle';
  warna: string;
  garis?: boolean;          
  lebar?: number;
  dash?: number[];
  opasitas?: number;
  bawaan?: boolean;       
  grup: string;
};

export const LAYERS: DefLayer[] = [
  {
    id: 'trace_g',
    nama: 'Trace G',
    sumber: 'trace_g',
    tipe: 'line',
    warna: '#6C4DFF',
    garis: true,
    lebar: 4,
    opasitas: 1,
    bawaan: true,
    grup: 'Rencana trace'
  },

  {
    id: 'bidang',
    nama: 'Bidang tanah',
    sumber: 'bidang',
    tipe: 'fill',
    warna: '#F59E0B',
    opasitas: 0.18,
    bawaan: true,
    grup: 'Bidang tanah'
  },

  {
    id: 'sawah',
    nama: 'Sawah',
    sumber: 'sawah',
    tipe: 'fill',
    warna: '#63C59A',
    opasitas: 0.42,
    grup: 'Tutupan lahan'
  },

  {
    id: 'hutan',
    nama: 'Hutan',
    sumber: 'hutan',
    tipe: 'fill',
    warna: '#287A5F',
    opasitas: 0.48,
    grup: 'Tutupan lahan'
  },

  {
    id: 'permukiman',
    nama: 'Permukiman',
    sumber: 'permukiman',
    tipe: 'fill',
    warna: '#E66F91',
    opasitas: 0.45,
    grup: 'Tutupan lahan'
  },

  {
    id: 'makam',
    nama: 'Makam',
    sumber: 'makam',
    tipe: 'fill',
    warna: '#9278C9',
    opasitas: 0.55,
    grup: 'Tutupan lahan'
  },

  {
    id: 'jalan',
    nama: 'Jalan eksisting',
    sumber: 'jalan',
    tipe: 'line',
    warna: '#4B5563',
    garis: true,
    lebar: 2,
    grup: 'Jaringan & utilitas'
  },

  {
    id: 'rel_ka',
    nama: 'Rel kereta api',
    sumber: 'rel_ka',
    tipe: 'line',
    warna: '#374151',
    garis: true,
    lebar: 2.5,
    dash: [6, 4],
    grup: 'Jaringan & utilitas'
  },

  {
    id: 'sungai',
    nama: 'Sungai',
    sumber: 'sungai',
    tipe: 'line',
    warna: '#3182BD',
    garis: true,
    lebar: 3,
    grup: 'Jaringan & utilitas'
  },

  {
    id: 'sutet',
    nama: 'Jaringan SUTET',
    sumber: 'sutet',
    tipe: 'line',
    warna: '#82C83E',
    garis: true,
    lebar: 2,
    dash: [7, 4],
    grup: 'Jaringan & utilitas'
  },

  {
    id: 'sutet_titik',
    nama: 'Titik tower SUTET',
    sumber: 'sutet_titik',
    tipe: 'circle',
    warna: '#82C83E',
    grup: 'Jaringan & utilitas'
  },

  {
    id: 'pipa_exxon',
    nama: 'Pipa Exxon',
    sumber: 'pipa_exxon',
    tipe: 'line',
    warna: '#00AFA3',
    garis: true,
    lebar: 2.5,
    dash: [8, 4],
    grup: 'Jaringan & utilitas'
  },

  {
    id: 'pipa_gresik_semarang',
    nama: 'Pipa Gresik–Semarang',
    sumber: 'pipa_gresik_semarang',
    tipe: 'line',
    warna: '#B85CC7',
    garis: true,
    lebar: 2.5,
    dash: [8, 4],
    grup: 'Jaringan & utilitas'
  }
];

/** Kontur disajikan dari PMTiles, bukan GeoJSON — jumlah simpulnya terlalu besar. */
export const KONTUR = {
  lidar: { id: 'kontur_lidar', nama: 'Kontur LiDAR', warna: '#B4A7EE', url: process.env.NEXT_PUBLIC_TILES_KONTUR_LIDAR },
  foto:  { id: 'kontur_foto',  nama: 'Kontur foto udara', warna: '#7FCFD6', url: process.env.NEXT_PUBLIC_TILES_KONTUR_FOTO }
};

export const DTM = {
  aws: process.env.NEXT_PUBLIC_TILES_DTM_AWS ?? '',
  r2: process.env.NEXT_PUBLIC_TILES_DTM_R2 ?? '',
};

export const ORTHO = process.env.NEXT_PUBLIC_TILES_ORTHO;

export const WARNA_PENGGUNAAN: Record<string, string> = {
  'Sawah': '#6FC7A4', 'Tegalan': '#8FBFD9', 'Pekarangan': '#B49BE5',
  'Permukiman': '#E0708F', 'Kebun': '#3D9E86', 'Tambak': '#5E8FD0', 'Tanah kosong': '#93A3B3'
};
