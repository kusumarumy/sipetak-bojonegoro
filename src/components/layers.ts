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


/* =========================================================
   LAYERS
========================================================= */

export const LAYERS: DefLayer[] = [

  /* -------------------------------------------------------
     RENCANA TRASE
  ------------------------------------------------------- */

  {
    id: 'traseg',
    nama: 'Trase rencana',
    sumber: 'traseg',
    tipe: 'line',
    warna: '#6C4DFF',
    garis: true,
    lebar: 4,
    opasitas: 1,
    bawaan: true,
    grup: 'Rencana trase'
  },


  /* -------------------------------------------------------
     BIDANG TANAH
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     TUTUPAN LAHAN
  ------------------------------------------------------- */

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
    nama: 'Vegetasi',
    sumber: 'hutan',
    tipe: 'fill',
    warna: '#287A5F',
    opasitas: 0.48,
    grup: 'Tutupan lahan'
  },

  {
    id: 'pemukiman',
    nama: 'Pemukiman',
    sumber: 'pemukiman',
    tipe: 'fill',
    warna: '#E66F91',
    opasitas: 0.45,
    grup: 'Tutupan lahan'
  },

  {
    id: 'pemakaman',
    nama: 'Makam',
    sumber: 'pemakaman',
    tipe: 'fill',
    warna: '#9278C9',
    opasitas: 0.55,
    grup: 'Tutupan lahan'
  },


  /* -------------------------------------------------------
     JARINGAN & UTILITAS
  ------------------------------------------------------- */

  {
    id: 'jalan',
    nama: 'Jalan eksisting',
    sumber: 'jalan',
    tipe: 'line',
    warna: '#8894A6',
    garis: true,
    lebar: 2,
    grup: 'Jaringan & utilitas'
  },

  {
    id: 'rel_kereta',
    nama: 'Rel kereta api',
    sumber: 'rel_kereta',
    tipe: 'line',
    warna: '#C3CCD9',
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
    id: 'kabel_sutet',
    nama: 'Jaringan SUTET',
    sumber: 'kabel_sutet',
    tipe: 'line',
    warna: '#9ED45E',
    garis: true,
    lebar: 2,
    dash: [7, 4],
    grup: 'Jaringan & utilitas'
  },

  {
    id: 'tiang_sutet',
    nama: 'Tower SUTET',
    sumber: 'tiang_sutet',
    tipe: 'circle',
    warna: '#9ED45E',
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
    id: 'pipa_gresem',
    nama: 'Pipa Gresik–Semarang',
    sumber: 'pipa_gresem',
    tipe: 'line',
    warna: '#C77DD4',
    garis: true,
    lebar: 2.5,
    dash: [8, 4],
    grup: 'Jaringan & utilitas'
  }
];


/* =========================================================
   KONTUR
========================================================= */

export const KONTUR = {
  lidar: {
    id: 'kontur_lidar',
    nama: 'Kontur LiDAR',
    warna: '#B4A7EE',
    url: process.env.NEXT_PUBLIC_TILES_KONTUR_LIDAR
  },

  foto: {
    id: 'kontur_foto',
    nama: 'Kontur foto udara',
    warna: '#7FCFD6',
    url: process.env.NEXT_PUBLIC_TILES_KONTUR_FOTO
  }
};


/* =========================================================
   DTM
========================================================= */

export const DTM = {
  aws:
    process.env.NEXT_PUBLIC_TILES_DTM_AWS ?? '',

  r2:
    process.env.NEXT_PUBLIC_TILES_DTM_R2 ?? ''
};


/* =========================================================
   ORTHOPHOTO
========================================================= */

export const ORTHO =
  process.env.NEXT_PUBLIC_TILES_ORTHO ?? '';


/* =========================================================
   PEWARNAAN BERDASARKAN PENGGUNAAN
========================================================= */

export const WARNA_PENGGUNAAN:
  Record<string, string> = {

  'Kosong':
    '#D9DDE3',

  'Tanah Persawahan':
    '#6FC7A4',

  'Tanah Perkampungan':
    '#E0708F',

  'Tanah Perumahan':
    '#B49BE5',

  'Lain-lain':
    '#93A3B3',

  'Tanah Tidak Ada Bangunan':
    '#8FBFD9',

  '(belum diisi)':
    '#7C8896'
};


/* =========================================================
   PEWARNAAN BERDASARKAN KETERDAMPAKAN
========================================================= */

/**
 * Semakin merah:
 * semakin besar bagian bidang yang masuk ROW.
 *
 * < 25%     → rendah
 * 25–50%    → sedang
 * 50–70%    → tinggi
 * ≥ 70%     → sangat tinggi
 * belum ukur → belum tersedia
 */

export const WARNA_DAMPAK:
  [string, string][] = [

  [
    '< 25%',
    '#A7D8C4'
  ],

  [
    '25–50%',
    '#F2C879'
  ],

  [
    '50–70%',
    '#E89B62'
  ],

  [
    '≥ 70%',
    '#D9534F'
  ],

  [
    'belum diukur',
    '#7C8896'
  ]
];


/* =========================================================
   LABEL LAYER
========================================================= */

export const LABEL_LAYER:
  Record<string, string> = {

  kabel_sutet:
    'Jaringan SUTET',

  tiang_sutet:
    'Tower SUTET',

  pipa_exxon:
    'Pipa Exxon',

  pipa_gresem:
    'Pipa Gresik–Semarang',

  pemakaman:
    'Makam',

  sungai:
    'Sungai',

  rel_kereta:
    'Rel kereta api',

  jalan:
    'Jalan eksisting'
};
