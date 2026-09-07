'use client';

import { useEffect, useMemo, useState } from 'react';

type Bidang = {
  id?: number;
  kode_bid?: string;
  nama_milik?: string;
  kelurahan?: string;
  desa?: string;

  luas_tnh?: number;
  luastertul?: number;
  luaspeta?: number;
  luas_atbt?: number;

  penggunaan?: string;
  bangunan?: string;
  jml_bgn?: number;

  status?: string;
};

type Props = {
  onClose: () => void;
};

const fmt = (n: number | null | undefined) =>
  n == null
    ? '—'
    : Number(n).toLocaleString('id-ID', {
        maximumFractionDigits: 2,
      });

const statusLabel: Record<string, string> = {
  draft: 'DRAFT',
  terkirim: 'MENUNGGU VERIFIKASI',
  terverifikasi: 'TERVERIFIKASI',
  revisi: 'PERLU REVISI',
};

export default function DaftarBidang({ onClose }: Props) {
  const [bidang, setBidang] = useState<Bidang[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [filter, setFilter] = useState('semua');

  useEffect(() => {
    const ambilData = async () => {
      try {
        setMemuat(true);

        const r = await fetch('/api/bidang');

        if (!r.ok) {
          const pesan = await r.text();
          throw new Error(pesan || `HTTP ${r.status}`);
        }

        const fc = await r.json();

        const data: Bidang[] = (fc.features ?? []).map(
          (f: any) => ({
            id: f.id,
            ...f.properties,
          })
        );

        setBidang(data);
      } catch (err) {
        console.error('Gagal mengambil data bidang:', err);
        setBidang([]);
      } finally {
        setMemuat(false);
      }
    };

    ambilData();
  }, []);

  const jumlah = useMemo(() => {
    return {
      semua: bidang.length,
      draft: bidang.filter((b) => b.status === 'draft').length,
      terkirim: bidang.filter((b) => b.status === 'terkirim').length,
      terverifikasi: bidang.filter(
        (b) => b.status === 'terverifikasi'
      ).length,
      revisi: bidang.filter((b) => b.status === 'revisi').length,
    };
  }, [bidang]);

  const dataTampil = useMemo(() => {
    if (filter === 'semua') {
      return bidang;
    }

    return bidang.filter((b) => b.status === filter);
  }, [bidang, filter]);

  return (
    <div className="daftar-overlay">
      <section className="daftar-bidang">

        {/* HEADER */}
        <div className="daftar-head">

          <div className="daftar-title">
            <span>DAFTAR BIDANG TERDAMPAK</span>

            <strong>
              {memuat
                ? 'Memuat...'
                : dataTampil.length.toLocaleString('id-ID')}
            </strong>

            <span>
              dari {bidang.length.toLocaleString('id-ID')} bidang
            </span>
          </div>

          <div className="daftar-actions">

            <button
              className={filter === 'semua' ? 'active' : ''}
              onClick={() => setFilter('semua')}
            >
              SEMUA ({jumlah.semua})
            </button>

            <button
              className={filter === 'draft' ? 'active' : ''}
              onClick={() => setFilter('draft')}
            >
              DRAFT ({jumlah.draft})
            </button>

            <button
              className={filter === 'terkirim' ? 'active' : ''}
              onClick={() => setFilter('terkirim')}
            >
              MENUNGGU VERIFIKASI ({jumlah.terkirim})
            </button>

            <button
              className={filter === 'terverifikasi' ? 'active' : ''}
              onClick={() => setFilter('terverifikasi')}
            >
              TERVERIFIKASI ({jumlah.terverifikasi})
            </button>

            <button
              className={filter === 'revisi' ? 'active' : ''}
              onClick={() => setFilter('revisi')}
            >
              PERLU REVISI ({jumlah.revisi})
            </button>

            <button
              type="button"
              className="daftar-close"
              onClick={onClose}
            >
              TUTUP
            </button>

          </div>
        </div>

        {/* TABLE */}
        <div className="daftar-table-wrap">
          <table className="daftar-table">

            <thead>
              <tr>
                <th>NO. BIDANG</th>
                <th>PEMILIK</th>
                <th>DESA</th>
                <th>LUAS (M²)</th>
                <th>TERDAMPAK (M²)</th>
                <th>PENGGUNAAN</th>
                <th>BANGUNAN</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>

              {memuat ? (
                <tr>
                  <td
                    colSpan={8}
                    className="daftar-empty"
                  >
                    Memuat data bidang...
                  </td>
                </tr>

              ) : dataTampil.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="daftar-empty"
                  >
                    Tidak ada bidang pada filter ini.
                  </td>
                </tr>

              ) : (
                dataTampil.map((b, i) => (
                  <tr
                    key={b.id ?? b.kode_bid ?? i}
                  >

                    {/* NO BIDANG */}
                    <td className="kode">
                      {b.kode_bid ?? '—'}
                    </td>

                    {/* PEMILIK */}
                    <td>
                      {b.nama_milik ?? '—'}
                    </td>

                    {/* DESA */}
                    <td>
                      {b.desa ?? b.kelurahan ?? '—'}
                    </td>

                    {/* LUAS */}
                    <td className="angka">
                      {fmt(b.luas_tnh)}
                    </td>

                    {/* TERDAMPAK */}
                    <td className="angka">
                      {fmt(b.luas_atbt)}
                    </td>

                    {/* PENGGUNAAN */}
                    <td>
                      {b.penggunaan ?? '—'}
                    </td>

                    {/* BANGUNAN */}
                    <td>
                      {b.bangunan ??
                        (b.jml_bgn != null
                          ? `${b.jml_bgn} bangunan`
                          : '—')}
                    </td>

                    {/* STATUS */}
                    <td>
                      <span className="status-daftar">
                        <span className="status-dot" />

                        {statusLabel[b.status ?? ''] ??
                          b.status ??
                          '—'}
                      </span>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

      </section>
    </div>
  );
}
