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
  id: 'traseg',
  nama: 'Trase rencana',
  sumber: 'traseg',
  tipe: 'line',
  warna: '#00E5FF',
  garis: true,
  lebar: 4,
  opasitas: 1,
  bawaan: true,
  grup: 'Rencana Trase'
},

{
  id: 'bidang',
  nama: 'Bidang tanah',
  sumber: 'bidang',
  tipe: 'fill',
  warna: '#E9967A',
  opasitas: 0.50,
  bawaan: true,
  grup: 'Bidang Tanah'
},

{
  id: 'sungai',
  nama: 'Sungai',
  sumber: 'sungai',
  tipe: 'line',
  warna: '#3182BD',
  garis: true,
  lebar: 3,
  grup: 'Jaringan Irigasi'
},

{
  id: 'jalan',
  nama: 'Jalan eksisting',
  sumber: 'jalan',
  tipe: 'line',
  warna: '#8894A6',
  garis: true,
  lebar: 2,
  grup: 'Jaringan Transportasi'
},

{
  id: 'rel_kereta',
  nama: 'Rel kereta api',
  sumber: 'rel_kereta',
  tipe: 'line',
  warna: '#6B7280',
  garis: true,
  lebar: 2.5,
  dash: [6, 4],
  grup: 'Jaringan Transportasi'
},

{
  id: 'hutan',
  nama: 'Vegetasi',
  sumber: 'hutan',
  tipe: 'fill',
  warna: '#7CB342',
  opasitas: 0.42,
  grup: 'Tutupan Lahan'
},

{
  id: 'pemakaman',
  nama: 'Makam',
  sumber: 'pemakaman',
  tipe: 'fill',
  warna: '#A1887F',
  opasitas: 0.50,
  grup: 'Tutupan Lahan'
},

{
  id: 'pemukiman',
  nama: 'Pemukiman',
  sumber: 'pemukiman',
  tipe: 'fill',
  warna: '#F4A6A6',
  opasitas: 0.50,
  grup: 'Tutupan Lahan'
},

{
  id: 'sawah',
  nama: 'Sawah',
  sumber: 'sawah',
  tipe: 'fill',
  warna: '#A8D08D',
  opasitas: 0.42,
  grup: 'Tutupan Lahan'
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
  grup: 'Utilitas'
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
  grup: 'Utilitas'
},

{
  id: 'pipa_gresem',
  nama: 'Pipa Gresik–Semarang',
  sumber: 'pipa_gresem',
  tipe: 'line',
  warna: '#E67E22',
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
  warna: '#9ED45E',
  grup: 'Utilitas'
},
  /*
  {
  id: 'kontur_kawasan',
  nama: 'Kontur Kawasan',
  sumber: 'kontur_kawasan',
  tipe: 'line',
  warna: '#A67C52',
  garis: true,
  lebar: 1.2,
  opasitas: 0.75,
  grup: 'Hipsografi'
},

{
  id: 'kontur_trase',
  nama: 'Kontur Trase',
  sumber: 'kontur_trase',
  tipe: 'line',
  warna: '#8B5E3C',
  garis: true,
  lebar: 1.5,
  opasitas: 0.85,
  grup: 'Hipsografi'
},
*/
];

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

export const DTM = {
  trace:
    `${process.env.NEXT_PUBLIC_R2_BASE_URL ?? ''}/dtm_trase/{z}/{x}/{y}.png`,

  aws:
    'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
};

export const ORTHO =
  process.env.NEXT_PUBLIC_TILES_ORTHO ?? '';


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
