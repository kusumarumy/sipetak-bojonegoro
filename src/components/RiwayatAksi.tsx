'use client';

import { useEffect, useMemo, useState } from 'react';

type AuditLog = {
  id?: number | string;

  // Identitas bidang
  nib?: string;
  record_id?: number | string;
  bidang_id?: string;

  // Aksi
  aksi?: string;
  kolom?: string;

  // Nilai perubahan
  nilai_lama?: any;
  nilai_baru?: any;

  // Pengguna
  nama_akun?: string;
  pengguna_id?: string;
  ip_address?: string;

  // Waktu
  pada?: string;
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

  // SORT
  const [sortKolom, setSortKolom] = useState('pada');
  const [sortArah, setSortArah] = useState<'asc' | 'desc'>('desc');

  /* =======================================================
     FUNGSI SORT
     ======================================================= */

  const ubahSort = (kolom: string) => {
    if (sortKolom === kolom) {
      setSortArah(
        sortArah === 'asc'
          ? 'desc'
          : 'asc'
      );
    } else {
      setSortKolom(kolom);
      setSortArah('asc');
    }
  };

  /* =======================================================
     AMBIL DATA RIWAYAT
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
     FILTER + SORT DATA
     ======================================================= */

  const dataTampil = useMemo(() => {
    const hasil =
      filter === 'semua'
        ? [...data]
        : data.filter(
            (d) =>
              d.aksi?.toUpperCase() ===
              filter.toUpperCase()
          );

    hasil.sort((a, b) => {
      let nilaiA: string | number = '';
      let nilaiB: string | number = '';

      switch (sortKolom) {
        case 'pada':
          nilaiA = a.pada
            ? new Date(a.pada).getTime()
            : 0;

          nilaiB = b.pada
            ? new Date(b.pada).getTime()
            : 0;
          break;

        case 'nama_akun':
          nilaiA = a.nama_akun ?? '';
          nilaiB = b.nama_akun ?? '';
          break;

        case 'nib':
          nilaiA = a.nib ?? '';
          nilaiB = b.nib ?? '';
          break;

        case 'record_id':
          nilaiA = Number(
            a.record_id ?? 0
          );

          nilaiB = Number(
            b.record_id ?? 0
          );
          break;

        case 'bidang_id':
          nilaiA = a.bidang_id ?? '';
          nilaiB = b.bidang_id ?? '';
          break;

        case 'aksi':
          nilaiA = a.aksi ?? '';
          nilaiB = b.aksi ?? '';
          break;

        case 'kolom':
          nilaiA = a.kolom ?? '';
          nilaiB = b.kolom ?? '';
          break;

        case 'nilai_lama':
          nilaiA = fmtNilai(
            a.nilai_lama
          );

          nilaiB = fmtNilai(
            b.nilai_lama
          );
          break;

        case 'nilai_baru':
          nilaiA = fmtNilai(
            a.nilai_baru
          );

          nilaiB = fmtNilai(
            b.nilai_baru
          );
          break;
      }

      let hasilSort = 0;

      if (
        typeof nilaiA === 'number' &&
        typeof nilaiB === 'number'
      ) {
        hasilSort = nilaiA - nilaiB;
      } else {
        hasilSort = String(
          nilaiA
        ).localeCompare(
          String(nilaiB),
          'id-ID',
          {
            numeric: true,
          }
        );
      }

      return sortArah === 'asc'
        ? hasilSort
        : -hasilSort;
    });

    return hasil;
  }, [
    data,
    filter,
    sortKolom,
    sortArah,
  ]);

  /* =======================================================
     ICON SORT
     ======================================================= */

  const iconSort = (kolom: string) => {
    if (sortKolom !== kolom) {
      return '↕';
    }

    return sortArah === 'asc'
      ? '↑'
      : '↓';
  };

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

            {/* SEMUA */}

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

            {/* INPUT */}

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

            {/* UPDATE */}

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

            {/* DELETE */}

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

            {/* TUTUP */}

            <button
              type="button"
              className="daftar-close"
              onClick={onClose}
            >
              TUTUP
            </button>

          </div>
        </div>

        {/* ===================================================
            TABLE
            =================================================== */}

        <div className="daftar-table-wrap">

          <table className="daftar-table">

            <thead>
              <tr>

                {/* WAKTU */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('pada')
                    }
                  >
                    <span>WAKTU</span>
                    <span className="sort-icon">
                      {iconSort('pada')}
                    </span>
                  </button>
                </th>

                {/* NAMA AKUN */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('nama_akun')
                    }
                  >
                    <span>NAMA AKUN</span>
                    <span className="sort-icon">
                      {iconSort('nama_akun')}
                    </span>
                  </button>
                </th>

                {/* NIB */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('nib')
                    }
                  >
                    <span>NIB</span>
                    <span className="sort-icon">
                      {iconSort('nib')}
                    </span>
                  </button>
                </th>

                {/* RECORD ID */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('record_id')
                    }
                  >
                    <span>RECORD ID</span>
                    <span className="sort-icon">
                      {iconSort('record_id')}
                    </span>
                  </button>
                </th>

                {/* BIDANG ID */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('bidang_id')
                    }
                  >
                    <span>BIDANG ID</span>
                    <span className="sort-icon">
                      {iconSort('bidang_id')}
                    </span>
                  </button>
                </th>

                {/* AKSI */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('aksi')
                    }
                  >
                    <span>AKSI</span>
                    <span className="sort-icon">
                      {iconSort('aksi')}
                    </span>
                  </button>
                </th>

                {/* KOLOM */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('kolom')
                    }
                  >
                    <span>KOLOM</span>
                    <span className="sort-icon">
                      {iconSort('kolom')}
                    </span>
                  </button>
                </th>

                {/* NILAI LAMA */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('nilai_lama')
                    }
                  >
                    <span>NILAI LAMA</span>
                    <span className="sort-icon">
                      {iconSort('nilai_lama')}
                    </span>
                  </button>
                </th>

                {/* NILAI BARU */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort('nilai_baru')
                    }
                  >
                    <span>NILAI BARU</span>
                    <span className="sort-icon">
                      {iconSort('nilai_baru')}
                    </span>
                  </button>
                </th>

              </tr>
            </thead>

            <tbody>

              {/* =================================================
                  LOADING
                  ================================================= */}

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

                /* =================================================
                   EMPTY
                   ================================================= */

                <tr>

                  <td
                    colSpan={9}
                    className="daftar-empty"
                  >
                    Tidak ada riwayat aksi.
                  </td>

                </tr>

              ) : (

                /* =================================================
                   DATA
                   ================================================= */

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
                      {item.nama_akun ??
                        '—'}
                    </td>

                    {/* NIB */}

                    <td className="kode">
                      {item.nib ??
                        '—'}
                    </td>

                    {/* RECORD ID */}

                    <td className="angka">
                      {item.record_id ??
                        '—'}
                    </td>

                    {/* BIDANG ID */}

                    <td className="kode">
                      {item.bidang_id ??
                        '—'}
                    </td>

                    {/* AKSI */}

                    <td>

                      <span
                        className={`status-daftar audit-${
                          item.aksi?.toLowerCase() ??
                          ''
                        }`}
                      >

                        <span className="status-dot" />

                        {
                          labelAksi[
                            item.aksi?.toUpperCase() ??
                              ''
                          ] ??
                          item.aksi ??
                          '—'
                        }

                      </span>

                    </td>

                    {/* KOLOM */}

                    <td>
                      {item.kolom ??
                        '—'}
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

      {/* =====================================================
          STYLE SORT HEADER
          ===================================================== */}

      <style jsx>{`
  /* =================================================
     PANEL RIWAYAT
     ================================================= */

  .daftar-flyout {
    position: relative;
    z-index: 20;
  }

  .daftar-bidang {
    background: #ffffff !important;
    border: 1px solid #d9e2ef !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    box-shadow:
      0 8px 24px rgba(15, 35, 70, 0.12),
      0 2px 6px rgba(15, 35, 70, 0.06) !important;
  }


  /* =================================================
     HEADER PANEL
     ================================================= */

  .daftar-head {
    background: #ffffff !important;
    border-bottom: 1px solid #d9e2ef !important;
  }

  .daftar-title {
    color: #0b2a6f !important;
  }

  .daftar-title > span:first-child {
    color: #0b2a6f !important;
    font-weight: 700 !important;
    letter-spacing: 0.08em !important;
  }

  .daftar-title strong {
    color: #6654c8 !important;
    font-weight: 700 !important;
  }

  .daftar-title > span:last-child {
    color: #7b8ba3 !important;
  }


  /* =================================================
     FILTER BUTTON
     ================================================= */

  .daftar-actions button {
    background: #f3f6fb !important;
    border: 1px solid #d5dfed !important;
    color: #5d6d84 !important;

    border-radius: 8px !important;

    font-size: 10px !important;
    font-weight: 700 !important;
    letter-spacing: 0.02em !important;

    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease !important;
  }

  .daftar-actions button:hover {
    background: #eaf0f8 !important;
    border-color: #c3d0e2 !important;
    color: #0b2a6f !important;
  }

  .daftar-actions button.active {
    background: #6654c8 !important;
    border-color: #6654c8 !important;
    color: #ffffff !important;

    box-shadow:
      0 3px 8px rgba(102, 84, 200, 0.20) !important;
  }

  .daftar-actions button.active:hover {
    background: #5948b8 !important;
    border-color: #5948b8 !important;
  }


  /* =================================================
     TOMBOL TUTUP
     ================================================= */

  .daftar-actions .daftar-close {
    background: #f7f9fc !important;
    border-color: #d5dfed !important;
    color: #53657d !important;
  }

  .daftar-actions .daftar-close:hover {
    background: #edf2f8 !important;
    color: #0b2a6f !important;
  }


  /* =================================================
     TABLE HEADER
     ================================================= */

  .daftar-table th {
    padding: 11px 14px !important;

    background: #f3f6fb !important;

    color: #61728a !important;

    border-bottom: 1px solid #d9e2ef !important;

    font-size: 10px !important;
    font-weight: 700 !important;

    letter-spacing: 0.035em !important;

    white-space: nowrap;
  }


  /* =================================================
     SORT HEADER
     ================================================= */

  .daftar-table th .sort-header {
    all: unset !important;

    display: inline-flex !important;
    align-items: center !important;

    gap: 5px !important;

    cursor: pointer !important;

    color: #61728a !important;

    font-family: inherit !important;
    font-size: 10px !important;
    font-weight: 700 !important;

    letter-spacing: 0.035em !important;
    line-height: 1 !important;

    padding: 3px 0 !important;
    margin: 0 !important;

    border: none !important;
    border-radius: 0 !important;

    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .daftar-table th .sort-header:hover {
    color: #0b2a6f !important;
    background: transparent !important;
  }

  .daftar-table th .sort-header:focus,
  .daftar-table th .sort-header:focus-visible {
    outline: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .daftar-table th .sort-header:active {
    transform: translateY(1px);
    background: transparent !important;
  }


  /* =================================================
     SORT ICON
     ================================================= */

  .sort-icon {
    display: inline-flex !important;

    align-items: center !important;
    justify-content: center !important;

    width: 12px !important;

    color: #9aa9bd !important;

    font-size: 11px !important;
    font-weight: 500 !important;

    line-height: 1 !important;

    transition: color 0.15s ease;
  }

  .daftar-table th .sort-header:hover .sort-icon {
    color: #6654c8 !important;
  }


  /* =================================================
     TABLE BODY
     ================================================= */

  .daftar-table tbody tr {
    background: #ffffff !important;

    border-bottom: 1px solid #e3e9f2 !important;

    transition:
      background 0.15s ease !important;
  }

  .daftar-table tbody tr:hover {
    background: #f5f8fd !important;
  }

  .daftar-table td {
    color: #34465e !important;

    border-bottom: 1px solid #e3e9f2 !important;

    font-size: 11px !important;
  }


  /* =================================================
     NIB / BIDANG ID
     ================================================= */

  .daftar-table .kode {
    color: #5547c8 !important;

    font-weight: 600 !important;

    font-variant-numeric: tabular-nums;
  }


  /* =================================================
     RECORD ID
     ================================================= */

  .daftar-table .angka {
    color: #53657d !important;

    font-variant-numeric: tabular-nums;

    font-weight: 500;
  }


  /* =================================================
     STATUS AKSI
     ================================================= */

  .status-daftar {
    display: inline-flex !important;

    align-items: center !important;
    gap: 6px !important;

    padding: 4px 7px !important;

    border-radius: 6px !important;

    font-size: 9px !important;
    font-weight: 700 !important;

    letter-spacing: 0.03em !important;
  }

  .status-dot {
    width: 6px !important;
    height: 6px !important;

    border-radius: 50% !important;

    background: currentColor !important;

    flex: 0 0 auto;
  }


  /* INPUT */

  .audit-input {
    color: #2f7a58 !important;
    background: #edf8f2 !important;
  }


  /* UPDATE */

  .audit-update {
    color: #4e67a8 !important;
    background: #eef3fb !important;
  }


  /* DELETE */

  .audit-delete {
    color: #a45b5b !important;
    background: #fbefef !important;
  }


  /* =================================================
     EMPTY / LOADING
     ================================================= */

  .daftar-empty {
    color: #7b8ba3 !important;

    background: #ffffff !important;

    font-size: 11px !important;
  }
`}</style>

    </div>
  );
}
