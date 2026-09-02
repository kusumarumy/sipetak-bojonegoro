/**
 * Impor GeoJSON ke PostGIS.
 *
 *   npm run import -- bidang      data/bidang.geojson
 *   npm run import -- layer:trace data/trace.geojson
 *
 * Sesuaikan PETA_KOLOM di bawah dengan nama atribut di GeoJSON milikmu.
 * Impor bidang bersifat upsert berdasarkan "kode", jadi aman diulang saat tim
 * lapangan mengirim pembaruan.
 *
 * Tidak yakin nama atributmu apa? Jalankan tanpa berkas kedua untuk melihat
 * daftar properti yang ada di GeoJSON:
 *   npm run import -- periksa data/bidang.geojson
 */
import './env.mts';
import { readFileSync, existsSync } from 'node:fs';
import { Client } from 'pg';

/* --------------------------------------------------------------
   Nama properti di GeoJSON  →  kolom di database.
   Ubah sisi KIRI sesuai berkas dari tim lapangan. Sisi kanan jangan diubah.
   -------------------------------------------------------------- */
const PETA_KOLOM: Record<string, string> = {
  NO_BIDANG:  'kode',
  DESA:       'desa',
  KECAMATAN:  'kecamatan',
  LUAS:       'luas_m2',
  LUAS_KENA:  'luas_terdampak_m2',
  PENGGUNAAN: 'penggunaan',
  ALAS_HAK:   'alas_hak',
  NIB:        'nib',
  NJOP:       'njop_m2',
  BATAS_U:    'batas_utara',
  BATAS_S:    'batas_selatan',
  BATAS_T:    'batas_timur',
  BATAS_B:    'batas_barat',
  TGL_UKUR:   'tanggal_ukur'
};
/** Properti pemilik, kalau menyatu di berkas bidang. */
const PETA_PEMILIK: Record<string, string> = {
  PEMILIK: 'nama', NIK: 'nik', ALAMAT: 'alamat',
  TELEPON: 'telepon', PEKERJAAN: 'pekerjaan'
};

const ANGKA = new Set(['luas_m2', 'luas_terdampak_m2', 'njop_m2']);

const [target, berkas] = process.argv.slice(2);
if (!target || !berkas) {
  console.error('\n  Pakai: npm run import -- <bidang | layer:NAMA | periksa> <berkas.geojson>\n');
  process.exit(1);
}
if (!existsSync(berkas)) { console.error(`\n  Berkas tidak ditemukan: ${berkas}\n`); process.exit(1); }

const fc = JSON.parse(readFileSync(berkas, 'utf8'));
if (fc.type !== 'FeatureCollection') { console.error('\n  Berkas bukan FeatureCollection.\n'); process.exit(1); }

/* Mode periksa: tampilkan properti yang ada, supaya PETA_KOLOM mudah disesuaikan */
if (target === 'periksa') {
  const kunci = new Set<string>();
  for (const f of fc.features.slice(0, 200)) for (const k of Object.keys(f.properties ?? {})) kunci.add(k);
  console.log(`\n  ${fc.features.length} objek. Properti yang ditemukan:\n`);
  const contoh = fc.features[0]?.properties ?? {};
  for (const k of [...kunci].sort())
    console.log(`    ${k.padEnd(22)} contoh: ${String(contoh[k]).slice(0, 40)}`);
  console.log(`\n  Salin nama-nama ini ke PETA_KOLOM di scripts/import-geojson.mts\n`);
  process.exit(0);
}

const ambil = (props: any, peta: Record<string, string>) => {
  const out: Record<string, any> = {};
  for (const [asal, kolom] of Object.entries(peta)) {
    let v = props[asal] ?? props[asal.toLowerCase()] ?? props[asal.toUpperCase()];
    if (v === undefined || v === null || v === '') continue;
    if (ANGKA.has(kolom)) {
      v = Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (Number.isNaN(v)) continue;
    }
    out[kolom] = v;
  }
  return out;
};

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

let masuk = 0, lewat = 0;
try {
  await c.query('BEGIN');

  if (target === 'bidang') {
    for (const f of fc.features) {
      const b = ambil(f.properties ?? {}, PETA_KOLOM);
      if (!b.kode) { lewat++; continue; }          // tanpa nomor bidang tidak bisa di-upsert

      const kolom = Object.keys(b);
      const nilai = Object.values(b);
      const ph = kolom.map((_, i) => `$${i + 2}`);
      const set = kolom.filter(k => k !== 'kode').map(k => `${k} = EXCLUDED.${k}`).join(', ');

      const r = await c.query(
        `INSERT INTO bidang (geom, ${kolom.join(', ')})
         VALUES (ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)), ${ph.join(', ')})
         ON CONFLICT (kode) DO UPDATE SET geom = EXCLUDED.geom${set ? ', ' + set : ''}
         RETURNING id`,
        [JSON.stringify(f.geometry), ...nilai]);

      const p = ambil(f.properties ?? {}, PETA_PEMILIK);
      if (p.nama) {
        await c.query('DELETE FROM pemilik WHERE bidang_id = $1 AND urutan = 1', [r.rows[0].id]);
        await c.query(
          `INSERT INTO pemilik (bidang_id, urutan, nama, nik, alamat, telepon, pekerjaan)
           VALUES ($1, 1, $2, $3, $4, $5, $6)`,
          [r.rows[0].id, p.nama, p.nik ?? null, p.alamat ?? null, p.telepon ?? null, p.pekerjaan ?? null]);
      }
      masuk++;
    }
  } else if (target.startsWith('layer:')) {
    const layer = target.slice(6);
    await c.query('DELETE FROM layer_geom WHERE layer = $1', [layer]);   // layer statis: ganti utuh
    for (const f of fc.features) {
      const props = f.properties ?? {};
      await c.query(
        `INSERT INTO layer_geom (layer, nama, props, geom)
         VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326))`,
        [layer, props.NAMA ?? props.nama ?? null, JSON.stringify(props), JSON.stringify(f.geometry)]);
      masuk++;
    }
  } else {
    throw new Error(`Target "${target}" tidak dikenal.`);
  }

  await c.query('COMMIT');
  console.log(`\n  ${masuk} objek masuk${lewat ? `, ${lewat} dilewati (tanpa nomor bidang)` : ''}.\n`);
} catch (e) {
  await c.query('ROLLBACK');
  console.error('\n  Impor dibatalkan, tidak ada yang tersimpan.');
  console.error('  ' + (e as Error).message + '\n');
  process.exitCode = 1;
} finally {
  await c.end();
}
