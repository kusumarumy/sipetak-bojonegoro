/**
 * Membuat akun. Tidak ada pendaftaran mandiri — akun dibuat manual.
 *
 *   npm run user:add -- rizal.a "Rizal Aditya" pendata
 *
 * Kata sandi dibangkitkan acak dan hanya ditampilkan sekali. Kirim lewat kanal
 * terpisah dari nama pengguna, dan minta yang bersangkutan menggantinya.
 */
import './env.mts';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';

const [username, nama, peran, sandiArg] = process.argv.slice(2);
const PERAN = ['pendata', 'supervisor', 'pelihat', 'pengembang'];

if (!username || !nama || !peran) {
  console.error('\n  Pakai: npm run user:add -- <username> "<Nama Lengkap>" <peran> [sandi]');
  console.error('  Peran: ' + PERAN.join(' | '));
  console.error('\n  Contoh: npm run user:add -- tirta.wp "Tirta W. P." pengembang\n');
  process.exit(1);
}
if (!PERAN.includes(peran)) {
  console.error(`\n  Peran "${peran}" tidak dikenal. Pilih: ${PERAN.join(', ')}\n`);
  process.exit(1);
}

const sandi = sandiArg ?? randomBytes(9).toString('base64url');
const c = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await c.connect();
  const hash = await bcrypt.hash(sandi, 12);
  await c.query(
    `INSERT INTO pengguna (username, nama, password_hash, peran)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (username) DO UPDATE SET nama = $2, password_hash = $3, peran = $4`,
    [username.toLowerCase(), nama, hash, peran]);

  console.log('\n  Akun siap');
  console.log('  ---------------------------------------');
  console.log(`  Nama pengguna : ${username.toLowerCase()}`);
  console.log(`  Kata sandi    : ${sandi}`);
  console.log(`  Peran         : ${peran}`);
  console.log('  ---------------------------------------');
  console.log('  Sandi ini tidak akan ditampilkan lagi.\n');
} catch (e) {
  const m = (e as Error).message;
  console.error('\n  Akun gagal dibuat.');
  console.error('  ' + m);
  if (m.includes('relation "pengguna"'))
    console.error('\n  Tabel belum ada. Jalankan dulu: npm run db:schema\n');
  else console.error('');
  process.exit(1);
} finally {
  await c.end();
}
