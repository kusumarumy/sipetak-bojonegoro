/**
 * Menjalankan db/schema.sql lewat Node, bukan psql.
 *
 *   npm run db:schema
 *
 * Cara lama memakai psql "$DATABASE_URL", dan tanda $ itu tidak dikenal di
 * PowerShell maupun cmd. Versi ini jalan sama di Windows, macOS, dan Linux,
 * dan tidak menuntut psql terpasang.
 */
import './env.mts';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const sql = readFileSync('db/schema.sql', 'utf8');
const c = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await c.connect();
} catch (e) {
  console.error('\n  Tidak bisa tersambung ke basis data.');
  console.error('  ' + (e as Error).message);
  console.error('\n  Periksa DATABASE_URL di .env, dan pastikan layanan PostgreSQL sedang jalan.\n');
  process.exit(1);
}

try {
  await c.query(sql);
  const { rows } = await c.query(
    `SELECT count(*)::int AS n FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`);
  console.log(`\n  Skema siap — ${rows[0].n} tabel di basis data.\n`);
} catch (e) {
  const m = (e as Error).message;
  console.error('\n  Skema gagal dipasang.');
  console.error('  ' + m);
  if (m.includes('postgis'))
    console.error('\n  Sepertinya PostGIS belum terpasang. Lihat langkah 2 di SETUP-WINDOWS.md\n');
  else console.error('');
  process.exit(1);
} finally {
  await c.end();
}
