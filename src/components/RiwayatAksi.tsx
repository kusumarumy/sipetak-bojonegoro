'use client';

import { useEffect, useMemo, useState } from 'react';

type AuditLog = {
  id?: number;
  tabel?: string;
  record_id?: number | string;
  bidang_id?: string;
  aksi?: string;
  kolom?: string;

  // Dipakai kalau ada di tabel audit_log
  nilai_lama?: any;
  nilai_baru?: any;

  // kemungkinan nama field waktu
  created_at?: string;
  waktu?: string;
  timestamp?: string;
};

type Props = {
  onClose: () => void;
};

const fmtTanggal = (value?: string) => {
  if (!value) return '—';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const fmtNilai = (value: any) => {
  if (value == null || value === '') return '—';

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const labelAksi: Record<string, string> = {
  INPUT: 'INPUT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

export default function RiwayatAksi({
  onClose,
}: Props) {
  const [data, setData] = useState<AuditLog[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [filter, setFilter] = useState('semua');

  useEffect(() => {
    const ambilData = async () => {
      try {
        setMemuat(true);

        const r = await fetch('/api/riwayat');

        if (!r.ok) {
          const pesan = await r.text();
          throw new Error(
            pesan || `HTTP ${r.status}`
          );
        }

        const hasil = await r.json();
        setData(Array.isArray(hasil) ? hasil : []);
        
      } catch (err) {
        console.error(
          'Gagal mengambil riwayat aksi:',
          err
        );

        setData([]);
      } finally {
        setMemuat(false);
      }
    };

    ambilData();
  }, []);

  const jumlah = useMemo(() => {
    return {
      semua: data.length,

      input: data.filter(
        (d) =>
          d.aksi?.toUpperCase() === 'INPUT'
      ).length,

      update: data.filter(
        (d) =>
          d.aksi?.toUpperCase() === 'UPDATE'
      ).length,

      delete: data.filter(
        (d) =>
          d.aksi?.toUpperCase() === 'DELETE'
      ).length,
    };
  }, [data]);

  const dataTampil = useMemo(() => {
    if (filter === 'semua') {
      return data;
    }

    return data.filter(
      (d) =>
        d.aksi?.toUpperCase() ===
        filter.toUpperCase()
    );
  }, [data, filter]);

  return (
    <div className="daftar-flyout">
      <section className="daftar-bidang">

        {/* HEADER */}
        <div className="daftar-head">

          <div className="daftar-title">

            <span>
              RIWAYAT AKSI
            </span>

            <strong>
              {memuat
                ? 'Memuat...'
                : dataTampil.length.toLocaleString(
                    'id-ID'
                  )}
            </strong>

            <span>
              dari {data.length.toLocaleString(
                'id-ID'
              )} aktivitas
            </span>

          </div>

          <div className="daftar-actions">

            {/* SEMUA */}
            <button
              className={
                filter === 'semua'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('semua')
              }
            >
              SEMUA ({jumlah.semua})
            </button>

            {/* INPUT */}
            <button
              className={
                filter === 'INPUT'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('INPUT')
              }
            >
              INPUT ({jumlah.input})
            </button>

            {/* UPDATE */}
            <button
              className={
                filter === 'UPDATE'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('UPDATE')
              }
            >
              UPDATE ({jumlah.update})
            </button>

            {/* DELETE */}
            <button
              className={
                filter === 'DELETE'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('DELETE')
              }
            >
              DELETE ({jumlah.delete})
            </button>

            {/* CLOSE */}
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
                <th>WAKTU</th>
                <th>TABEL</th>
                <th>RECORD ID</th>
                <th>BIDANG ID</th>
                <th>AKSI</th>
                <th>KOLOM</th>
                <th>NILAI LAMA</th>
                <th>NILAI BARU</th>
              </tr>
            </thead>

            <tbody>

              {memuat ? (

                <tr>
                  <td
                    colSpan={8}
                    className="daftar-empty"
                  >
                    Memuat riwayat aksi...
                  </td>
                </tr>

              ) : dataTampil.length === 0 ? (

                <tr>
                  <td
                    colSpan={8}
                    className="daftar-empty"
                  >
                    Tidak ada riwayat aksi.
                  </td>
                </tr>

              ) : (

                dataTampil.map((item, i) => (

                  <tr
                    key={
                      item.id ?? i
                    }
                  >

                    {/* WAKTU */}
                    <td>
                      {fmtTanggal(
                        item.created_at ??
                        item.waktu ??
                        item.timestamp
                      )}
                    </td>

                    {/* TABEL */}
                    <td>
                      {item.tabel ?? '—'}
                    </td>

                    {/* RECORD ID */}
                    <td className="angka">
                      {item.record_id ?? '—'}
                    </td>

                    {/* BIDANG ID */}
                    <td className="kode">
                      {item.bidang_id ?? '—'}
                    </td>

                    {/* AKSI */}
                    <td>
                      <span
                        className={`status-daftar audit-${item.aksi?.toLowerCase()}`}
                      >
                        <span className="status-dot" />

                        {labelAksi[
                          item.aksi?.toUpperCase() ?? ''
                        ] ??
                          item.aksi ??
                          '—'}
                      </span>
                    </td>

                    {/* KOLOM */}
                    <td>
                      {item.kolom ?? '—'}
                    </td>

                    {/* NILAI LAMA */}
                    <td>
                      {fmtNilai(
                        item.nilai_lama
                      )}
                    </td>

                    {/* NILAI BARU */}
                    <td>
                      {fmtNilai(
                        item.nilai_baru
                      )}
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
