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

const [sortKolom, setSortKolom] = useState('pada');
const [sortArah, setSortArah] = useState<'asc' | 'desc'>('desc');

  const ubahSort = (kolom: string) => {
  if (sortKolom === kolom) {
    setSortArah(sortArah === 'asc' ? 'desc' : 'asc');
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

        /*
         * API mengembalikan array langsung:
         *
         * [
         *   {
         *     id: "6",
         *     nib: "...",
         *     record_id: 191,
         *     bidang_id: "...",
         *     aksi: "DELETE",
         *     kolom: "kode_bid",
         *     nilai_lama: "111",
         *     nilai_baru: "",
         *     nama_akun: "Pendata Lapangan",
         *     pada: "2026-09-11T10:03:58.515Z"
         *   }
         * ]
         */

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
     FILTER DATA
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
        nilaiA = Number(a.record_id ?? 0);
        nilaiB = Number(b.record_id ?? 0);
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
        nilaiA = fmtNilai(a.nilai_lama);
        nilaiB = fmtNilai(b.nilai_lama);
        break;

      case 'nilai_baru':
        nilaiA = fmtNilai(a.nilai_baru);
        nilaiB = fmtNilai(b.nilai_baru);
        break;
    }

    let hasilSort = 0;

    if (
      typeof nilaiA === 'number' &&
      typeof nilaiB === 'number'
    ) {
      hasilSort = nilaiA - nilaiB;
    } else {
      hasilSort = String(nilaiA).localeCompare(
        String(nilaiB),
        'id-ID',
        { numeric: true }
      );
    }

    return sortArah === 'asc'
      ? hasilSort
      : -hasilSort;
  });

  return hasil;
}, [data, filter, sortKolom, sortArah]);

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

            {/* =================================================
                SEMUA
                ================================================= */}

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

            {/* =================================================
                INPUT
                ================================================= */}

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

            {/* =================================================
                UPDATE
                ================================================= */}

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

            {/* =================================================
                DELETE
                ================================================= */}

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

            {/* =================================================
                TUTUP
                ================================================= */}

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

                <th>
                  <button onClick={() => ubahSort('pada')}>
                    WAKTU {sortKolom === 'pada' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                
                <th>
                  <button onClick={() => ubahSort('nama_akun')}>
                    NAMA AKUN {sortKolom === 'nama_akun' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                
                <th>
                  <button onClick={() => ubahSort('nib')}>
                    NIB {sortKolom === 'nib' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                
                <th>
                  <button onClick={() => ubahSort('record_id')}>
                    RECORD ID {sortKolom === 'record_id' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                
                <th>
                  <button onClick={() => ubahSort('bidang_id')}>
                    BIDANG ID {sortKolom === 'bidang_id' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                
                <th>
                  <button onClick={() => ubahSort('aksi')}>
                    AKSI {sortKolom === 'aksi' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                
                <th>
                  <button onClick={() => ubahSort('kolom')}>
                    KOLOM {sortKolom === 'kolom' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                
                <th>
                  <button onClick={() => ubahSort('nilai_lama')}>
                    NILAI LAMA {sortKolom === 'nilai_lama' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                
                <th>
                  <button onClick={() => ubahSort('nilai_baru')}>
                    NILAI BARU {sortKolom === 'nilai_baru' ? (sortArah === 'asc' ? '↑' : '↓') : '↕'}
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

                /* ===============================================
                   EMPTY
                   =============================================== */

                <tr>

                  <td
                    colSpan={9}
                    className="daftar-empty"
                  >
                    Tidak ada riwayat aksi.
                  </td>

                </tr>

              ) : (

                /* ===============================================
                   DATA
                   =============================================== */

                dataTampil.map((item, i) => (

                  <tr
                    key={
                      item.id ?? i
                    }
                  >

                    {/* =========================================
                        WAKTU
                        ========================================= */}

                    <td>
                      {fmtTanggal(
                        item.pada
                      )}
                    </td>

                    {/* =========================================
                        NAMA AKUN
                        ========================================= */}

                    <td>
                      {item.nama_akun ?? '—'}
                    </td>

                    {/* =========================================
                        NIB
                        ========================================= */}

                    <td className="kode">
                      {item.nib ?? '—'}
                    </td>

                    {/* =========================================
                        RECORD ID
                        ========================================= */}

                    <td className="angka">
                      {item.record_id ?? '—'}
                    </td>

                    {/* =========================================
                        BIDANG ID
                        ========================================= */}

                    <td className="kode">
                      {item.bidang_id ?? '—'}
                    </td>

                    {/* =========================================
                        AKSI
                        ========================================= */}

                    <td>

                      <span
                        className={`status-daftar audit-${
                          item.aksi?.toLowerCase() ?? ''
                        }`}
                      >

                        <span className="status-dot" />

                        {
                          labelAksi[
                            item.aksi?.toUpperCase() ?? ''
                          ] ??
                          item.aksi ??
                          '—'
                        }

                      </span>

                    </td>

                    {/* =========================================
                        KOLOM
                        ========================================= */}

                    <td>
                      {item.kolom ?? '—'}
                    </td>

                    {/* =========================================
                        NILAI LAMA
                        ========================================= */}

                    <td>
                      {fmtNilai(
                        item.nilai_lama
                      )}
                    </td>

                    {/* =========================================
                        NILAI BARU
                        ========================================= */}

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
