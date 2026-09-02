import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { query } from '@/lib/db';
import Peta from '@/components/Peta';

export const dynamic = 'force-dynamic';

export default async function Halaman() {
  const sesi = await auth();
  if (!sesi?.user) redirect('/login');

  // Ringkasan dihitung di server — satu query, bukan 950 baris dikirim ke klien
  const [r] = await query<any>(`
    SELECT count(*) AS total,
           count(*) FILTER (WHERE status='draft')         AS draft,
           count(*) FILTER (WHERE status='terkirim')      AS terkirim,
           count(*) FILTER (WHERE status='terverifikasi') AS terverifikasi,
           count(*) FILTER (WHERE status='revisi')        AS revisi,
           COALESCE(sum(luas_terdampak_m2),0)/10000 AS ha_terdampak
    FROM bidang`);

  const [t] = await query<any>(`
    SELECT COALESCE(sum(ST_Length(geom::geography)),0)/1000 AS km
    FROM layer_geom WHERE layer='trace'`);

  async function keluar() { 'use server'; await signOut({ redirectTo: '/login' }); }

  return (
    <Peta
      pengguna={sesi.user}
      ringkasan={{
        total: +r.total, draft: +r.draft, terkirim: +r.terkirim,
        terverifikasi: +r.terverifikasi, revisi: +r.revisi,
        haTerdampak: +r.ha_terdampak, km: +t.km
      }}
      keluar={keluar}
    />
  );
}
