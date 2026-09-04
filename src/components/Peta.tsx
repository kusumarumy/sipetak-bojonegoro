'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ControlPanel from './ControlPanel';
import KartuBidang from './KartuBidang';
import { useApp } from '@/store/useApp';
import {
  STATUS_LABEL,
  STATUS_WARNA,
  type Peran,
  type StatusBidang
} from '@/types';

import { WARNA_PENGGUNAAN } from './layers';

const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

type Ringkasan = {
  total: number; draft: number; terkirim: number; terverifikasi: number;
  revisi: number; haTerdampak: number; km: number;
};

export default function Peta({ pengguna, ringkasan, keluar }: {
  pengguna: { name: string; peran: Peran };
  ringkasan: Ringkasan;
  keluar: () => Promise<void>;
}) {const {
  kartu,
  pesan,
  beriPesan,
  pewarnaan
} = useApp();
const [panel, setPanel] = useState(false);
const [showProgress, setShowProgress] = useState(false);
const [cari, setCari] = useState('');
const [hasil, setHasil] = useState<any[]>([]);
const [jumlahPenggunaan, setJumlahPenggunaan] = useState<Record<string, number>>({});
const [tema, setTema] = useState<'light' | 'dark'>('light');
useEffect(() => {
  const saved = localStorage.getItem('dppt-tema');

  const current =
    saved === 'dark' || saved === 'light'
      ? saved
      : 'light';

  setTema(current);
  document.documentElement.dataset.theme = current;
}, []);
  useEffect(() => {
    if (!pesan) return;
    const t = setTimeout(() => beriPesan(null), 3200);
    return () => clearTimeout(t);
  }, [pesan]);
useEffect(() => {
  fetch('/api/bidang')
    .then(r => r.json())
    .then((fc) => {
      const counts: Record<string, number> = {
        'Kosong': 0,
        'Tanah Persawahan': 0,
        'Tanah Perkampungan': 0,
        'Tanah Perumahan': 0,
        'Lain-lain': 0,
        'Tanah Tidak Ada Bangunan': 0,
        'Belum diisi': 0,
      };

      for (const f of fc.features ?? []) {
        const value = f.properties?.penggunaan;

        if (value === null || value === undefined || value === '') {
          counts['Belum diisi']++;
        } else if (value in counts) {
          counts[value]++;
        }
      }

      setJumlahPenggunaan(counts);
    })
    .catch(() => {});
}, []);
  useEffect(() => {
    if (cari.trim().length < 2) { setHasil([]); return; }
    const t = setTimeout(() => {
      fetch('/api/bidang').then(r => r.json()).then((fc) => {
        const q = cari.toLowerCase();
        setHasil(fc.features
          .filter((f: any) => f.properties.kode.toLowerCase().includes(q) ||
                              (f.properties.pemilik ?? '').toLowerCase().includes(q))
          .slice(0, 12).map((f: any) => f.properties));
      }).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [cari]);
const toggleTema = () => {
  const next = tema === 'dark' ? 'light' : 'dark';

  setTema(next);
  localStorage.setItem('dppt-tema', next);
  document.documentElement.dataset.theme = next;
};
  const pct = ringkasan.total ? Math.round(ringkasan.terverifikasi / ringkasan.total * 100) : 0;
  const angka: [StatusBidang, number][] = [
    ['draft', ringkasan.draft], ['terkirim', ringkasan.terkirim],
    ['terverifikasi', ringkasan.terverifikasi], ['revisi', ringkasan.revisi]
  ];

  return (
    <div className="shell">
      <header className="bar">

  {/* BRAND */}
  <div className="head-brand">

    <img
      src="https://bojonegorokab.go.id/portal/assets/img/logo-kabupaten.png"
      alt="Logo Kabupaten Bojonegoro"
      className="head-logo"
    />

    <div className="head-brand-text">

      <span className="head-eyebrow">
        DPPT BOJONEGORO
      </span>

      <strong>
        Dokumen Perencanaan Pengadaan Tanah Jalur Lingkar Selatan Kabupaten Bojonegoro
      </strong>

    </div>

  </div>


  {/* AKSI HEADER */}
  <div className="head-actions">

    {/* PENCARIAN */}
    <div className="head-search">

      <span className="head-search-icon">
        ⌕
      </span>

      <input
        type="text"
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="Cari nomor bidang atau nama pemilik..."
      />

    </div>


    {/* DAFTAR BIDANG */}
    <button
      type="button"
      className="head-action-btn"
      onClick={() => setPanel(true)}
    >
      <span className="head-action-icon">
        ☷
      </span>

      <span>
        Daftar Bidang
      </span>
    </button>


    {/* ZOOM TRACE */}
    <button
      type="button"
      className="head-action-btn"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent('zoom-trace')
        );
      }}
    >
      <span className="head-action-icon">
        ⌾
      </span>

      <span>
        Zoom Trace
      </span>
    </button>

  </div>


  {/* USER + TEMA */}
  <div className="head-user">

    {/* THEME */}
    <button
      type="button"
      className="head-theme"
      aria-label={
        tema === 'dark'
          ? 'Aktifkan tema terang'
          : 'Aktifkan tema gelap'
      }
      title={
        tema === 'dark'
          ? 'Tema terang'
          : 'Tema gelap'
      }
      onClick={toggleTema}
    >
      {tema === 'dark' ? '☀' : '☾'}
    </button>


    {/* USER */}
    <div className="head-user-info">

      <span className="head-user-role">
        PENGEMBANG
      </span>

      <strong>
        Pengembang Sistem
      </strong>

    </div>


    {/* KELUAR */}
    <form action={keluar}>

      <button
        type="submit"
        className="head-logout"
      >
        Keluar
      </button>

    </form>

  </div>

</header>
      <main className="body">
        <ControlPanel terbuka={panel} />
        <div className="mapwrap">
          <MapCanvas />

{/* =====================================================
    PROGRESS / LEGEND — DEFAULT HIDDEN
    ===================================================== */}

{showProgress ? (

  <div className="progress float">

    {/* HEADER */}
    <div className="ph">

      <span className="lbl">
        {pewarnaan === 'status'
          ? 'Progres verifikasi'
          : 'Penggunaan bidang'}
      </span>

      <div className="progress-head-right">

        {pewarnaan === 'status' && (
          <b>{pct}%</b>
        )}

        <button
          type="button"
          className="progress-close"
          onClick={() => setShowProgress(false)}
          title="Sembunyikan"
          aria-label="Sembunyikan progres"
        >
          ×
        </button>

      </div>

    </div>


    {/* PROGRESS BAR — HANYA STATUS */}
    {pewarnaan === 'status' && (
      <div className="progress-bar">

        {angka.map(([s, n]) => (
          <span
            key={s}
            style={{
              width: `${
                ringkasan.total
                  ? (n / ringkasan.total) * 100
                  : 0
              }%`,
              background: STATUS_WARNA[s]
            }}
          />
        ))}

      </div>
    )}


    {/* LEGEND */}
    <div className="legend">

      {pewarnaan === 'status' ? (

        angka.map(([s, n]) => (
          <div className="li" key={s}>

            <span
              className="swatch"
              style={{
                background: STATUS_WARNA[s]
              }}
            />

            <span>
              {STATUS_LABEL[s]}
            </span>

            <b>
              {n.toLocaleString('id-ID')}
            </b>

          </div>
        ))

      ) : (

        <>
          {Object.entries(WARNA_PENGGUNAAN).map(
            ([nama, warna]) => (
              <div className="li" key={nama}>

                <span
                  className="swatch"
                  style={{
                    background: warna
                  }}
                />

                <span>
                  {nama}
                </span>

                <b>
                  {(
                    jumlahPenggunaan[nama] ?? 0
                  ).toLocaleString('id-ID')}
                </b>

              </div>
            )
          )}

          {/* NULL / BELUM DIISI */}
          <div className="li">

            <span
              className="swatch"
              style={{
                background: '#888'
              }}
            />

            <span>
              Belum diisi
            </span>

            <b>
              {(
                jumlahPenggunaan['Belum diisi'] ?? 0
              ).toLocaleString('id-ID')}
            </b>

          </div>
        </>

      )}

    </div>

  </div>

) : (

  /* =====================================================
     TOMBOL KECIL UNTUK MEMBUKA
     ===================================================== */

  <button
    type="button"
    className="progress-toggle"
    onClick={() => setShowProgress(true)}
    title="Tampilkan progres dan legenda"
    aria-label="Tampilkan progres dan legenda"
  >
    ◔
  </button>

)}

  </div>

</div>

          {pesan && <div className="toast">{pesan}</div>}
          {kartu && <KartuBidang peran={pengguna.peran} />}
        </div>
      </main>
    </div>
  );
}
