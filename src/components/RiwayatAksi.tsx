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

    /* -----------------------------------------------
       HEADER TABLE
       ----------------------------------------------- */

    .daftar-table th {
      padding: 10px 12px !important;
      background: rgba(
        248,
        250,
        252,
        0.9
      ) !important;

      border-bottom:
        1px solid
        rgba(
          148,
          163,
          184,
          0.22
        ) !important;

      white-space: nowrap;
    }


    /* -----------------------------------------------
       SORT HEADER
       ----------------------------------------------- */

    .daftar-table th .sort-header {
      all: unset !important;

      display: inline-flex !important;

      align-items: center !important;

      gap: 5px !important;

      cursor: pointer !important;

      color: #64748b !important;

      font-family: inherit !important;

      font-size: 11px !important;

      font-weight: 600 !important;

      letter-spacing: 0.02em !important;

      line-height: 1 !important;

      padding: 2px 0 !important;

      margin: 0 !important;

      border: none !important;

      border-radius: 0 !important;

      background:
        transparent !important;

      box-shadow: none !important;

      outline: none !important;
    }


    /* -----------------------------------------------
       HOVER
       ----------------------------------------------- */

    .daftar-table th
      .sort-header:hover {

      color: #4f46e5 !important;

      background:
        transparent !important;

      border: none !important;

      box-shadow: none !important;
    }


    /* -----------------------------------------------
       FOCUS
       ----------------------------------------------- */

    .daftar-table th
      .sort-header:focus,
    .daftar-table th
      .sort-header:focus-visible {

      outline: none !important;

      border: none !important;

      box-shadow: none !important;

      background:
        transparent !important;
    }


    /* -----------------------------------------------
       ACTIVE / CLICK
       ----------------------------------------------- */

    .daftar-table th
      .sort-header:active {

      transform:
        translateY(1px);

      background:
        transparent !important;

      border: none !important;
    }


    /* -----------------------------------------------
       SORT ICON
       ----------------------------------------------- */

    .sort-icon {

      display: inline-flex !important;

      align-items: center !important;

      justify-content: center !important;

      width: 12px !important;

      font-size: 12px !important;

      line-height: 1 !important;

      font-weight: 500 !important;

      color: #94a3b8 !important;
    }


    .daftar-table th
      .sort-header:hover
      .sort-icon {

      color: #4f46e5 !important;
    }


    /* -----------------------------------------------
       ROW HOVER
       ----------------------------------------------- */

    .daftar-table tbody tr {

      transition:
        background
        0.15s ease;
    }


    .daftar-table tbody tr:hover {

      background:
        rgba(
          99,
          102,
          241,
          0.035
        );
    }


    /* -----------------------------------------------
       KODE / NIB / BIDANG ID
       ----------------------------------------------- */

    .daftar-table .kode {

      color: #5b4bd8;

      font-weight: 500;
    }


    /* -----------------------------------------------
       ANGKA
       ----------------------------------------------- */

    .daftar-table .angka {

      color: #475569;

      font-variant-numeric:
        tabular-nums;
    }

  `}</style>

</div>

);
}
