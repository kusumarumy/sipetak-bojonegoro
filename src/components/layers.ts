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
     01 — RENCANA TRASE
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
     02 — BIDANG TANAH
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
     03 — JARINGAN IRIGASI
  ------------------------------------------------------- */

  {
    id: 'sungai',
    nama: 'Sungai',
    sumber: 'sungai',
    tipe: 'line',
    warna: '#3182BD',
    garis: true,
    lebar: 3,
    grup: 'Jaringan irigasi'
  },


  /* -------------------------------------------------------
     04 — JARINGAN TRANSPORTASI
  ------------------------------------------------------- */

  {
    id: 'jalan',
    nama: 'Jalan eksisting',
    sumber: 'jalan',
    tipe: 'line',
    warna: '#66758A',
    garis: true,
    lebar: 2,
    grup: 'Jaringan transportasi'
  },

  {
    id: 'rel_kereta',
    nama: 'Rel kereta api',
    sumber: 'rel_kereta',
    tipe: 'line',
    warna: '#AEB9C8',
    garis: true,
    lebar: 2.5,
    dash: [6, 4],
    grup: 'Jaringan transportasi'
  },


  /* -------------------------------------------------------
     05 — TUTUPAN LAHAN
  ------------------------------------------------------- */

  {
    id: 'pemakaman',
    nama: 'Makam',
    sumber: 'pemakaman',
    tipe: 'fill',
    warna: '#9278C9',
    opasitas: 0.50,
    grup: 'Tutupan lahan'
  },

  {
    id: 'pemukiman',
    nama: 'Pemukiman',
    sumber: 'pemukiman',
    tipe: 'fill',
    warna: '#E16F91',
    opasitas: 0.42,
    grup: 'Tutupan lahan'
  },

  {
    id: 'sawah',
    nama: 'Sawah',
    sumber: 'sawah',
    tipe: 'fill',
    warna: '#63C59A',
    opasitas: 0.40,
    grup: 'Tutupan lahan'
  },

  {
    id: 'hutan',
    nama: 'Vegetasi',
    sumber: 'hutan',
    tipe: 'fill',
    warna: '#287A5F',
    opasitas: 0.46,
    grup: 'Tutupan lahan'
  },


  /* -------------------------------------------------------
     06 — UTILITAS
  ------------------------------------------------------- */

  {
    id: 'kabel_sutet',
    nama: 'Jaringan SUTET',
    sumber: 'kabel_sutet',
    tipe: 'line',
    warna: '#8FC84A',
    garis: true,
    lebar: 2,
    dash: [7, 4],
    grup: 'Utilitas'
  },

  {
    id: 'pipa_exxon',
    nama: 'Pipa Exxon',
    sumber: 'pipa_exxon',
    tipe: 'line',
    warna: '#00A79D',
    garis: true,
    lebar: 2.5,
    dash: [8, 4],
    grup: 'Utilitas'
  },

  {
    id: 'pipa_gresem',
    nama: 'Pipa Gresik–Semarang',
    sumber: 'pipa_gresem',
    tipe: 'line',
    warna: '#C174CF',
    garis: true,
    lebar: 2.5,
    dash: [8, 4],
    grup: 'Utilitas'
  },

  {
    id: 'tiang_sutet',
    nama: 'Tower SUTET',
    sumber: 'tiang_sutet',
    tipe: 'circle',
    warna: '#8FC84A',
    grup: 'Utilitas'
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
