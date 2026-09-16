'use client';

import { useEffect, useMemo, useState } from 'react';

type AuditLog = {
  id?: number | string;
  tabel?: string;
  record_id?: number | string;
  bidang_id?: string;
  aksi?: string;
  kolom?: string;

  nilai_lama?: any;
  nilai_baru?: any;

  // dari audit_log
  pada?: string;
  nama_akun?: string;

  pengguna_id?: string;
  ip_address?: string;
};

type Props = {
  onClose: () => void;
};

/* =========================================================
   FORMAT WAKTU
   ========================================================= */

const fmtTanggal = (value?: string) => {
  if (!value) return '—';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/* =========================================================
   FORMAT NILAI
   ========================================================= */

const fmtNilai = (value: any) => {
  if (value == null || value === '') {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

/* =========================================================
   LABEL AKSI
   ========================================================= */

const labelAksi: Record<string, string> = {
  INPUT: 'INPUT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

/* =========================================================
   COMPONENT
   ========================================================= */

export default function RiwayatAksi({
  onClose,
}: Props) {
  const [data, setData] = useState<AuditLog[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [filter, setFilter] = useState('semua');

  /* =======================================================
     AMBIL DATA
     ======================================================= */

  useEffect(() => {
    const ambilData = async () => {
      try {
        setMemuat(true);

        const r = await fetch('/api/riwayat', {
          cache: 'no-store',
        });

        if (!r.ok) {
          const pesan = await r.text();

          throw new Error(
            pesan || `HTTP ${r.status}`
          );
        }

        const hasil = await r.json();

        setData(
          Array.isArray(hasil)
            ? hasil
            : []
        );
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

  /* =======================================================
     JUMLAH AKSI
     ======================================================= */

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

  /* =======================================================
     FILTER
     ======================================================= */

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

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="daftar-flyout">

      <section className="daftar-bidang">

        {/* =================================================
            HEADER
            ================================================= */}

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
              dari{' '}
              {data.length.toLocaleString(
                'id-ID'
              )}{' '}
              aktivitas
            </span>

          </div>

          <div className="daftar-actions">

            <button
              type="button"
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

            <button
              type="button"
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

            <button
              type="button"
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

            <button
              type="button"
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

            <button
              type="button"
              className="daftar-close"
              onClick={onClose}
            >
              TUTUP
            </button>

          </div>
        </div>

        {/* =================================================
            TABLE
            ================================================= */}

        <div className="daftar-table-wrap">

          <table className="daftar-table">

            <thead>

              <tr>
                <th>WAKTU</th>
                <th>NAMA AKUN</th>
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
                    colSpan={9}
                    className="daftar-empty"
                  >
                    Memuat riwayat aksi...
                  </td>
                </tr>

              ) : dataTampil.length === 0 ? (

                <tr>
                  <td
                    colSpan={9}
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
                        item.pada
                      )}
                    </td>

                    {/* NAMA AKUN */}
                    <td>
                      {item.nama_akun ?? '—'}
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
                        className={`status-daftar audit-${
                          item.aksi?.toLowerCase() ?? ''
                        }`}
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
