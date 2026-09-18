'use client';

import { useEffect, useMemo, useState } from 'react';

type Bidang = {
  id?: number;
  objectid?: number;

  bidang_id?: string;
  kodewilaya?: string;
  kecamatan?: string;
  kelurahan?: string;

  tipehak?: string;
  tipeproduk?: string;
  tahun?: number;
  nib?: string;

  luastertul?: number;
  luaspeta?: number;
  sumbergeom?: number;

  alatukur?: string;
  penggunaan?: string;
  metodukur?: string;

  shape_leng?: number;
  shape_area?: number;

  hub_tnh?: string;
  kode_wwc?: string;
  jenis_tnh?: string;
  kode_bid?: string;
  rt_rw?: string;

  nama_milik?: string;
  ttl_milik?: string;
  krja_milik?: string;
  almt_milik?: string;
  nik_milik?: string;

  nama_sewa?: string;
  ttl_sewa?: string;
  krja_sewa?: string;
  almt_sewa?: string;
  nik_sewa?: string;

  nomor_hp?: string;

  sta_tnh?: string;
  surat_hak?: string;
  nomor_hak?: string;

  luas_tnh?: number;

  ruang_atbt?: string;
  luas_atbt?: number;

  jenis_tnm?: string;
  jumlah_tnm?: number;

  jenis_bnd?: string;
  jumlah_bnd?: number;

  beban_hak?: string;
  dampak_tnh?: string;
  jml_bgn?: number;

  date_updt?: string;
  foto_tnh?: string;

  fid?: string;
  nama?: string;
  layer?: string;
  path?: string;

  created_at?: string;

  status?: string;

  luas_terdampak_m2?: number;
  luas_sisa_m2?: number;

  catatan_supervisor?: string;
  petugas_nama?: string;

  tanggal_ukur?: string;
  dikirim_pada?: string;
  diverifikasi_pada?: string;

  alas_hak?: string;

  geometry?: any;
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

const fmtText = (value: string | number | null | undefined) =>
  value == null || value === '' ? '—' : String(value);

const fmtDate = (value: string | null | undefined) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('id-ID');
};

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
type SortDirection = 'asc' | 'desc' | null;

const [sortKey, setSortKey] = useState<keyof Bidang | null>(null);
const [sortDirection, setSortDirection] =
  useState<SortDirection>(null);
  const handleSort = (key: keyof Bidang) => {
  if (sortKey !== key) {
    setSortKey(key);
    setSortDirection('asc');
    return;
  }

  if (sortDirection === 'asc') {
    setSortDirection('desc');
    return;
  }

  setSortKey(null);
  setSortDirection(null);
};
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
  let data =
    filter === 'semua'
      ? [...bidang]
      : bidang.filter((b) => b.status === filter);

  if (!sortKey || !sortDirection) {
    return data;
  }

  data.sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    let hasil = 0;

const fieldTanggal = [
  'created_at',
  'tanggal_ukur',
  'dikirim_pada',
  'diverifikasi_pada',
].includes(String(sortKey));

if (fieldTanggal) {
  hasil =
    new Date(String(av)).getTime() -
    new Date(String(bv)).getTime();
} else if (
  typeof av === 'number' &&
  typeof bv === 'number'
) {
  hasil = av - bv;
} else {
  hasil = String(av).localeCompare(
    String(bv),
    'id-ID',
    {
      numeric: true,
      sensitivity: 'base',
    }
  );
}

    return sortDirection === 'asc'
      ? hasil
      : -hasil;
  });

  return data;
}, [bidang, filter, sortKey, sortDirection]);
const SortHeader = ({
  label,
  field,
}: {
  label: string;
  field: keyof Bidang;
}) => (
  <button
    type="button"
    className="sort-header"
    onClick={() => handleSort(field)}
  >
    <span>{label}</span>

    <span className="sort-icon">
      {sortKey === field
        ? sortDirection === 'asc'
          ? '↑'
          : '↓'
        : '↕'}
    </span>
  </button>
);
  return (
    <div className="daftar-flyout">
      <section className="daftar-bidang">

        {/* HEADER */}
        <div className="daftar-head">

          <div className="daftar-head-main">

            <div className="daftar-head-icon">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <path
                  d="M8 8h8M8 12h8M8 16h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="daftar-title-wrap">

              <div className="daftar-title">

                <strong>
                  DAFTAR BIDANG TERDAMPAK
                </strong>

                <span className="daftar-count">
                  {memuat
                    ? 'Memuat…'
                    : `${dataTampil.length.toLocaleString('id-ID')} bidang`}
                </span>

              </div>

              <span className="daftar-subtitle">
                Daftar bidang tanah yang terdampak pada area analisis
              </span>

            </div>

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
              aria-label="Tutup daftar bidang"
              title="Tutup"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

          </div>

        </div>

        {/* TABLE */}
        <div className="daftar-table-wrap">
          <table className="daftar-table">

<thead>
  <tr>
    <th><SortHeader label="ID" field="id" /></th>
    <th><SortHeader label="OBJECTID" field="objectid" /></th>
    <th><SortHeader label="BIDANG ID" field="bidang_id" /></th>
    <th><SortHeader label="KODE WILAYAH" field="kodewilaya" /></th>
    <th><SortHeader label="KECAMATAN" field="kecamatan" /></th>
    <th><SortHeader label="KELURAHAN" field="kelurahan" /></th>
    <th><SortHeader label="TIPE HAK" field="tipehak" /></th>
    <th><SortHeader label="TIPE PRODUK" field="tipeproduk" /></th>
    <th><SortHeader label="TAHUN" field="tahun" /></th>
    <th><SortHeader label="NIB" field="nib" /></th>
    <th><SortHeader label="LUAS TERTUL (M²)" field="luastertul" /></th>
    <th><SortHeader label="LUAS PETA (M²)" field="luaspeta" /></th>
    <th><SortHeader label="SUMBER GEOM" field="sumbergeom" /></th>
    <th><SortHeader label="ALAT UKUR" field="alatukur" /></th>
    <th><SortHeader label="PENGGUNAAN" field="penggunaan" /></th>
    <th><SortHeader label="METODE UKUR" field="metodukur" /></th>
    <th><SortHeader label="SHAPE LENGTH" field="shape_leng" /></th>
    <th><SortHeader label="SHAPE AREA" field="shape_area" /></th>
    <th><SortHeader label="HUB. TANAH" field="hub_tnh" /></th>
    <th><SortHeader label="KODE WWC" field="kode_wwc" /></th>
    <th><SortHeader label="JENIS TANAH" field="jenis_tnh" /></th>
    <th><SortHeader label="KODE BIDANG" field="kode_bid" /></th>
    <th><SortHeader label="RT/RW" field="rt_rw" /></th>
    <th><SortHeader label="NAMA PEMILIK" field="nama_milik" /></th>
    <th><SortHeader label="TTL PEMILIK" field="ttl_milik" /></th>
    <th><SortHeader label="PEKERJAAN PEMILIK" field="krja_milik" /></th>
    <th><SortHeader label="ALAMAT PEMILIK" field="almt_milik" /></th>
    <th><SortHeader label="NIK PEMILIK" field="nik_milik" /></th>
    <th><SortHeader label="NAMA PENYEWA" field="nama_sewa" /></th>
    <th><SortHeader label="TTL PENYEWA" field="ttl_sewa" /></th>
    <th><SortHeader label="PEKERJAAN PENYEWA" field="krja_sewa" /></th>
    <th><SortHeader label="ALAMAT PENYEWA" field="almt_sewa" /></th>
    <th><SortHeader label="NIK PENYEWA" field="nik_sewa" /></th>
    <th><SortHeader label="NOMOR HP" field="nomor_hp" /></th>
    <th><SortHeader label="STATUS TANAH" field="sta_tnh" /></th>
    <th><SortHeader label="SURAT HAK" field="surat_hak" /></th>
    <th><SortHeader label="NOMOR HAK" field="nomor_hak" /></th>
    <th><SortHeader label="LUAS TANAH (M²)" field="luas_tnh" /></th>
    <th><SortHeader label="RUANG ATBT" field="ruang_atbt" /></th>
    <th><SortHeader label="LUAS ATBT (M²)" field="luas_atbt" /></th>
    <th><SortHeader label="JENIS TANAMAN" field="jenis_tnm" /></th>
    <th><SortHeader label="JUMLAH TANAMAN" field="jumlah_tnm" /></th>
    <th><SortHeader label="JENIS BENDA" field="jenis_bnd" /></th>
    <th><SortHeader label="JUMLAH BENDA" field="jumlah_bnd" /></th>
    <th><SortHeader label="BEBAN HAK" field="beban_hak" /></th>
    <th><SortHeader label="DAMPAK TANAH" field="dampak_tnh" /></th>
    <th><SortHeader label="JUMLAH BANGUNAN" field="jml_bgn" /></th>
    <th><SortHeader label="TANGGAL UPDATE" field="date_updt" /></th>
    <th><SortHeader label="FOTO TANAH" field="foto_tnh" /></th>
    <th><SortHeader label="FID" field="fid" /></th>
    <th><SortHeader label="NAMA" field="nama" /></th>
    <th><SortHeader label="LAYER" field="layer" /></th>
    <th><SortHeader label="PATH" field="path" /></th>
    <th><SortHeader label="DIBUAT" field="created_at" /></th>
    <th><SortHeader label="STATUS" field="status" /></th>
    <th><SortHeader label="LUAS TERDAMPAK (M²)" field="luas_terdampak_m2" /></th>
    <th><SortHeader label="LUAS SISA (M²)" field="luas_sisa_m2" /></th>
    <th><SortHeader label="CATATAN SUPERVISOR" field="catatan_supervisor" /></th>
    <th><SortHeader label="PETUGAS" field="petugas_nama" /></th>
    <th><SortHeader label="TANGGAL UKUR" field="tanggal_ukur" /></th>
    <th><SortHeader label="DIKIRIM PADA" field="dikirim_pada" /></th>
    <th><SortHeader label="DIVERIFIKASI PADA" field="diverifikasi_pada" /></th>
    <th><SortHeader label="ALAS HAK" field="alas_hak" /></th>
  </tr>
</thead>

            <tbody>

              {memuat ? (
                <tr>
                  <td
                    colSpan={62}
                    className="daftar-empty"
                  >
                    Memuat data bidang...
                  </td>
                </tr>

              ) : dataTampil.length === 0 ? (
                <tr>
                  <td
                    colSpan={62}
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

                    <td className="angka">
                      {b.id ?? '—'}
                    </td>

                    <td className="angka">
                      {b.objectid ?? '—'}
                    </td>

                    <td>
                      {fmtText(b.bidang_id)}
                    </td>

                    <td>
                      {fmtText(b.kodewilaya)}
                    </td>

                    <td>
                      {fmtText(b.kecamatan)}
                    </td>

                    <td>
                      {fmtText(b.kelurahan)}
                    </td>

                    <td>
                      {fmtText(b.tipehak)}
                    </td>

                    <td>
                      {fmtText(b.tipeproduk)}
                    </td>

                    <td className="angka">
                      {b.tahun ?? '—'}
                    </td>

                    <td>
                      {fmtText(b.nib)}
                    </td>

                    <td className="angka">
                      {fmt(b.luastertul)}
                    </td>

                    <td className="angka">
                      {fmt(b.luaspeta)}
                    </td>

                    <td className="angka">
                      {fmt(b.sumbergeom)}
                    </td>

                    <td>
                      {fmtText(b.alatukur)}
                    </td>

                    <td>
                      {fmtText(b.penggunaan)}
                    </td>

                    <td>
                      {fmtText(b.metodukur)}
                    </td>

                    <td className="angka">
                      {fmt(b.shape_leng)}
                    </td>

                    <td className="angka">
                      {fmt(b.shape_area)}
                    </td>

                    <td>
                      {fmtText(b.hub_tnh)}
                    </td>

                    <td>
                      {fmtText(b.kode_wwc)}
                    </td>

                    <td>
                      {fmtText(b.jenis_tnh)}
                    </td>

                    <td className="kode">
                      {fmtText(b.kode_bid)}
                    </td>

                    <td>
                      {fmtText(b.rt_rw)}
                    </td>

                    <td>
                      {fmtText(b.nama_milik)}
                    </td>

                    <td>
                      {fmtText(b.ttl_milik)}
                    </td>

                    <td>
                      {fmtText(b.krja_milik)}
                    </td>

                    <td>
                      {fmtText(b.almt_milik)}
                    </td>

                    <td>
                      {fmtText(b.nik_milik)}
                    </td>

                    <td>
                      {fmtText(b.nama_sewa)}
                    </td>

                    <td>
                      {fmtText(b.ttl_sewa)}
                    </td>

                    <td>
                      {fmtText(b.krja_sewa)}
                    </td>

                    <td>
                      {fmtText(b.almt_sewa)}
                    </td>

                    <td>
                      {fmtText(b.nik_sewa)}
                    </td>

                    <td>
                      {fmtText(b.nomor_hp)}
                    </td>

                    <td>
                      {fmtText(b.sta_tnh)}
                    </td>

                    <td>
                      {fmtText(b.surat_hak)}
                    </td>

                    <td>
                      {fmtText(b.nomor_hak)}
                    </td>

                    <td className="angka">
                      {fmt(b.luas_tnh)}
                    </td>

                    <td>
                      {fmtText(b.ruang_atbt)}
                    </td>

                    <td className="angka">
                      {fmt(b.luas_atbt)}
                    </td>

                    <td>
                      {fmtText(b.jenis_tnm)}
                    </td>

                    <td className="angka">
                      {fmt(b.jumlah_tnm)}
                    </td>

                    <td>
                      {fmtText(b.jenis_bnd)}
                    </td>

                    <td className="angka">
                      {fmt(b.jumlah_bnd)}
                    </td>

                    <td>
                      {fmtText(b.beban_hak)}
                    </td>

                    <td>
                      {fmtText(b.dampak_tnh)}
                    </td>

                    <td className="angka">
                      {fmt(b.jml_bgn)}
                    </td>

                    <td>
                      {fmtText(b.date_updt)}
                    </td>

                    <td>
                      {fmtText(b.foto_tnh)}
                    </td>

                    <td>
                      {fmtText(b.fid)}
                    </td>

                    <td>
                      {fmtText(b.nama)}
                    </td>

                    <td>
                      {fmtText(b.layer)}
                    </td>

                    <td>
                      {fmtText(b.path)}
                    </td>

                    <td>
                      {fmtDate(b.created_at)}
                    </td>

                    <td>
                      <span className="status-daftar">
                        <span className="status-dot" />

                        {statusLabel[b.status ?? ''] ??
                          b.status ??
                          '—'}
                      </span>
                    </td>

                    <td className="angka">
                      {fmt(b.luas_terdampak_m2)}
                    </td>

                    <td className="angka">
                      {fmt(b.luas_sisa_m2)}
                    </td>

                    <td>
                      {fmtText(b.catatan_supervisor)}
                    </td>

                    <td>
                      {fmtText(b.petugas_nama)}
                    </td>

                    <td>
                      {fmtDate(b.tanggal_ukur)}
                    </td>

                    <td>
                      {fmtDate(b.dikirim_pada)}
                    </td>

                    <td>
                      {fmtDate(b.diverifikasi_pada)}
                    </td>

                    <td>
                      {fmtText(b.alas_hak)}
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
