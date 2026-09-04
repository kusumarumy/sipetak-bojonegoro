import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { query } from '@/lib/db';
import Peta from '@/components/Peta';

export const dynamic = 'force-dynamic';
export default async function Halaman() {
  const sesi = await auth();
  if (!sesi?.user) redirect('/login');
  const [r] = await query<any>(`
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (
      WHERE status = 'draft'
    ) AS draft,
    COUNT(*) FILTER (
      WHERE status = 'terkirim'
    ) AS terkirim,
    COUNT(*) FILTER (
      WHERE status = 'terverifikasi'
    ) AS terverifikasi,
    COUNT(*) FILTER (
      WHERE status = 'revisi'
    ) AS revisi,
    COALESCE(
      (
        SELECT SUM(luas_terdampak_m2)
        FROM bidang
      ),
      0
    ) / 10000 AS ha_terdampak

  FROM public.bidang_tanah
`);
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
