'use client';

import { useEffect, useMemo, useState } from 'react';

type Bidang = {
  id?: string;
  kode?: string;
  pemilik?: string;
  desa?: string;
  luas_m2?: number;
  luas_terdampak_m2?: number;
  penggunaan?: string;
  bangunan?: string;
  status?: string;
  kelengkapan?: number;
};

type Props = {
  onClose: () => void;
};

const fmt = (n: number | null | undefined) =>
  n == null
    ? '—'
    : n.toLocaleString('id-ID');

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
    fetch('/api/bidang')
      .then((r) => r.json())
      .then((fc) => {
        const data: Bidang[] = (fc.features ?? []).map((f: any) => ({
          id: f.id,
          ...f.properties,
        }));

        setBidang(data);
      })
      .catch(() => {
        setBidang([]);
      })
      .finally(() => {
        setMemuat(false);
      });
  }, []);

  const jumlah = useMemo(() => {
    return {
      semua: bidang.length,
      draft: bidang.filter((b) => b.status === 'draft').length,
      terkirim: bidang.filter((b) => b.status === 'terkirim').length,
      terverifikasi: bidang.filter((b) => b.status === 'terverifikasi').length,
      revisi: bidang.filter((b) => b.status === 'revisi').length,
    };
  }, [bidang]);

  const dataTampil = useMemo(() => {
    if (filter === 'semua') return bidang;

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
              {memuat ? 'Memuat...' : dataTampil.length.toLocaleString('id-ID')}
            </strong>

            <span>dari {bidang.length.toLocaleString('id-ID')} bidang</span>
          </div>

          <div className="daftar-actions">
            <button
              className={filter === 'semua' ? 'active' : ''}
              onClick={() => setFilter('semua')}
            >
              SEMUA
            </button>

            <button
              className={filter === 'draft' ? 'active' : ''}
              onClick={() => setFilter('draft')}
            >
              DRAFT
            </button>

            <button
              className={filter === 'terkirim' ? 'active' : ''}
              onClick={() => setFilter('terkirim')}
            >
              MENUNGGU VERIFIKASI
            </button>

            <button
              className={filter === 'terverifikasi' ? 'active' : ''}
              onClick={() => setFilter('terverifikasi')}
            >
              TERVERIFIKASI
            </button>

            <button
              className={filter === 'revisi' ? 'active' : ''}
              onClick={() => setFilter('revisi')}
            >
              PERLU REVISI
            </button>

            <button
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
                <th>KELENGKAPAN</th>
              </tr>
            </thead>

            <tbody>
              {memuat ? (
                <tr>
                  <td colSpan={9} className="daftar-empty">
                    Memuat data bidang...
                  </td>
                </tr>
              ) : dataTampil.length === 0 ? (
                <tr>
                  <td colSpan={9} className="daftar-empty">
                    Tidak ada bidang pada filter ini.
                  </td>
                </tr>
              ) : (
                dataTampil.map((b, i) => (
                  <tr key={b.id ?? b.kode ?? i}>
                    <td className="kode">
                      {b.kode ?? '—'}
                    </td>

                    <td>
                      {b.pemilik ?? '—'}
                    </td>

                    <td>
                      {b.desa ?? '—'}
                    </td>

                    <td className="angka">
                      {fmt(b.luas_m2)}
                    </td>

                    <td className="angka">
                      {fmt(b.luas_terdampak_m2)}
                    </td>

                    <td>
                      {b.penggunaan ?? '—'}
                    </td>

                    <td>
                      {b.bangunan ?? '—'}
                    </td>

                    <td>
                      <span className="status-daftar">
                        <span className="status-dot" />
                        {statusLabel[b.status ?? ''] ?? b.status ?? '—'}
                      </span>
                    </td>

                    <td className="angka">
                      {b.kelengkapan != null
                        ? `${b.kelengkapan}%`
                        : '—'}
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
