/**
 * Membaca .env tanpa pustaka tambahan.
 * Next.js memuat .env sendiri, tapi skrip yang dijalankan lewat tsx tidak —
 * jadi setiap skrip mengimpor berkas ini di baris pertama.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const berkas = resolve(process.cwd(), '.env');

if (!existsSync(berkas)) {
  console.error('\n  Berkas .env belum ada.');
  console.error('  Salin dulu: copy .env.example .env  lalu isi DATABASE_URL.\n');
  process.exit(1);
}

for (const baris of readFileSync(berkas, 'utf8').split(/\r?\n/)) {
  const t = baris.trim();
  if (!t || t.startsWith('#')) continue;
  const p = t.indexOf('=');
  if (p < 0) continue;
  const kunci = t.slice(0, p).trim();
  let nilai = t.slice(p + 1).trim();
  if ((nilai.startsWith('"') && nilai.endsWith('"')) ||
      (nilai.startsWith("'") && nilai.endsWith("'"))) nilai = nilai.slice(1, -1);
  if (!(kunci in process.env)) process.env[kunci] = nilai;
}

if (!process.env.DATABASE_URL) {
  console.error('\n  DATABASE_URL belum diisi di .env\n');
  process.exit(1);
}
