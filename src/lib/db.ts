import { Pool, type PoolClient } from 'pg';

const url = process.env.DATABASE_URL;

/**
 * Di Vercel setiap request bisa membangunkan instance baru, jadi kolam koneksi
 * dibuat sekecil mungkin dan diarahkan ke connection pooler Supabase (port 6543).
 * Tanpa itu, slot koneksi database habis begitu beberapa orang membuka aplikasi
 * bersamaan — persis pada saat paparan.
 */
const pool = new Pool({
  connectionString: url,
  max: process.env.VERCEL ? 1 : 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  // Supabase mewajibkan TLS. Sertifikatnya diterbitkan otoritas internal,
  // jadi verifikasi rantai dimatikan — koneksinya tetap terenkripsi.
  ssl: url && (url.includes('supabase.') || url.includes('sslmode=require'))
    ? { rejectUnauthorized: false }
    : undefined
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

/**
 * Transaksi dengan identitas pengguna terpasang.
 * app.pengguna_id dibaca oleh trigger catat_audit() di database, sehingga setiap
 * perubahan tercatat pelakunya tanpa perlu menulis audit manual di setiap query.
 */
export async function transaksi<T>(
  penggunaId: string | null,
  fn: (c: PoolClient) => Promise<T>
): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('SELECT set_config($1, $2, true)', ['app.pengguna_id', penggunaId ?? '']);
    const hasil = await fn(c);
    await c.query('COMMIT');
    return hasil;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
