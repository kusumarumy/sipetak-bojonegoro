/**
 * Reproyeksi GeoJSON dari UTM 49S (EPSG:32749) ke WGS84 (EPSG:4326).
 *
 *   npm run reproyeksi
 *   npm run reproyeksi -- data\bidang.geojson
 *
 * Tanpa argumen: memproses seluruh .geojson di folder data\ yang koordinatnya
 * masih UTM, hasilnya ditulis ke data\wgs84\. Berkas yang sudah WGS84 dilewati.
 *
 * Tidak memerlukan GDAL/ogr2ogr — rumus proyeksi Transverse Mercator ditulis
 * langsung di sini, jadi jalan di laptop mana pun yang punya Node.
 *
 * Sekaligus membuang koordinat Z. Kolom geometri di database hanya menerima 2D,
 * dan berkas dari Global Mapper sering membawa dimensi Z yang membuat impor
 * gagal dengan pesan "Geometry has Z dimension but column does not".
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

/* ---------- Parameter UTM zona 49 Selatan ---------- */
const A = 6378137.0;               // sumbu panjang WGS84
const F = 1 / 298.257223563;       // pemampatan
const K0 = 0.9996;                 // faktor skala UTM
const LON0 = 111 * Math.PI / 180;  // meridian tengah zona 49
const X0 = 500000;                 // false easting
const Y0 = 10000000;               // false northing (belahan selatan)

const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);
const E1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));

/** UTM 49S → [bujur, lintang] dalam derajat. */
function keWGS84(x: number, y: number): [number, number] {
  const xx = x - X0;
  const yy = y - Y0;

  const M = yy / K0;
  const mu = M / (A * (1 - E2 / 4 - 3 * E2 ** 2 / 64 - 5 * E2 ** 3 / 256));

  const phi1 =
    mu +
    (3 * E1 / 2 - 27 * E1 ** 3 / 32) * Math.sin(2 * mu) +
    (21 * E1 ** 2 / 16 - 55 * E1 ** 4 / 32) * Math.sin(4 * mu) +
    (151 * E1 ** 3 / 96) * Math.sin(6 * mu) +
    (1097 * E1 ** 4 / 512) * Math.sin(8 * mu);

  const sin1 = Math.sin(phi1), cos1 = Math.cos(phi1), tan1 = Math.tan(phi1);
  const C1 = EP2 * cos1 ** 2;
  const T1 = tan1 ** 2;
  const N1 = A / Math.sqrt(1 - E2 * sin1 ** 2);
  const R1 = A * (1 - E2) / (1 - E2 * sin1 ** 2) ** 1.5;
  const D = xx / (N1 * K0);

  const lat =
    phi1 -
    (N1 * tan1 / R1) *
      (D ** 2 / 2 -
       (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * EP2) * D ** 4 / 24 +
       (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * EP2 - 3 * C1 ** 2) * D ** 6 / 720);

  const lon =
    LON0 +
    (D -
     (1 + 2 * T1 + C1) * D ** 3 / 6 +
     (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * EP2 + 24 * T1 ** 2) * D ** 5 / 120) / cos1;

  const bulat = (n: number) => Math.round(n * 1e6) / 1e6;   // 6 desimal ≈ 11 cm
  return [bulat(lon * 180 / Math.PI), bulat(lat * 180 / Math.PI)];
}

/** Koordinat di atas 180 pasti bukan derajat — berarti masih dalam meter. */
const masihUTM = (koor: any): boolean => {
  if (typeof koor[0] === 'number') return Math.abs(koor[0]) > 180;
  return masihUTM(koor[0]);
};

/** Menelusuri sarang array koordinat sedalam apa pun, sekalian membuang Z. */
function ubah(koor: any): any {
  if (typeof koor[0] === 'number') return keWGS84(koor[0], koor[1]);
  return koor.map(ubah);
}

function proses(masukan: string, keluaran: string) {
  const fc = JSON.parse(readFileSync(masukan, 'utf8'));
  if (fc.type !== 'FeatureCollection') {
    console.log(`  lewati  ${basename(masukan)} — bukan FeatureCollection`);
    return;
  }
  if (!fc.features.length) {
    console.log(`  lewati  ${basename(masukan)} — kosong`);
    return;
  }

  const contoh = fc.features.find((f: any) => f.geometry?.coordinates);
  if (!contoh) { console.log(`  lewati  ${basename(masukan)} — tanpa geometri`); return; }

  if (!masihUTM(contoh.geometry.coordinates)) {
    console.log(`  lewati  ${basename(masukan)} — sudah WGS84`);
    return;
  }

  let n = 0;
  for (const f of fc.features) {
    if (!f.geometry?.coordinates) continue;
    f.geometry.coordinates = ubah(f.geometry.coordinates);
    n++;
  }
  fc.crs = undefined;
  writeFileSync(keluaran, JSON.stringify(fc));

  const [lon, lat] = contoh.geometry.coordinates.flat(Infinity).slice(0, 2);
  console.log(`  ok      ${basename(masukan).padEnd(26)} ${n} objek   contoh: ${lon}, ${lat}`);
}

/* ---------- jalan ---------- */
const argumen = process.argv.slice(2);
const tujuan = join('data', 'wgs84');
if (!existsSync(tujuan)) mkdirSync(tujuan, { recursive: true });

console.log('\n  Reproyeksi UTM 49S (EPSG:32749) → WGS84 (EPSG:4326)\n');

if (argumen.length) {
  for (const berkas of argumen) proses(berkas, join(tujuan, basename(berkas)));
} else {
const daftar = readdirSync('data')
  .filter((f: string) => f.toLowerCase().endsWith('.geojson'))
  .filter((f: string) => !f.toLowerCase().startsWith('kontur'));
  if (!daftar.length) { console.log('  Tidak ada .geojson di folder data\\\n'); process.exit(0); }
  for (const f of daftar) proses(join('data', f), join(tujuan, f));
}

console.log(`\n  Hasil ada di ${tujuan}\\\n`);
