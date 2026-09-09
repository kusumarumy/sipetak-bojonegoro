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
  total: number;
  draft: number;
  terkirim: number;
  terverifikasi: number;
  revisi: number;
  haTerdampak: number;
  km: number;
};

export default function Peta({
  pengguna,
  ringkasan,
  keluar
}: {
  pengguna: { name: string; peran: Peran };
  ringkasan: Ringkasan;
  keluar: () => Promise<void>;
}) {
  const {
    kartu,
    pesan,
    beriPesan,
    pewarnaan
  } = useApp();

  const [panel, setPanel] = useState(false);

  const [tema, setTema] = useState<'light' | 'dark'>('light');

  const [jumlahPenggunaan, setJumlahPenggunaan] =
    useState<Record<string, number>>({
      'Kosong': 0,
      'Tanah Persawahan': 0,
      'Tanah Perkampungan': 0,
      'Tanah Perumahan': 0,
      'Lain-lain': 0,
      'Tanah Tidak Ada Bangunan': 0,
      'Belum diisi': 0,
    });

  /* =========================================================
     TEMA
     ========================================================= */

  useEffect(() => {
    const saved = localStorage.getItem('dppt-tema');

    const current =
      saved === 'dark' || saved === 'light'
        ? saved
        : 'light';

    setTema(current);
    document.documentElement.dataset.theme = current;
  }, []);

  const toggleTema = () => {
    const next = tema === 'dark' ? 'light' : 'dark';

    setTema(next);

    localStorage.setItem('dppt-tema', next);

    document.documentElement.dataset.theme = next;
  };


  /* =========================================================
     TOAST
     ========================================================= */

  useEffect(() => {
    if (!pesan) return;

    const t = setTimeout(() => {
      beriPesan(null);
    }, 3200);

    return () => clearTimeout(t);
  }, [pesan, beriPesan]);


  /* =========================================================
     JUMLAH PENGGUNAAN
     ========================================================= */

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

          if (
            value === null ||
            value === undefined ||
            value === ''
          ) {
            counts['Belum diisi']++;
          }

          else if (value in counts) {
            counts[value]++;
          }
        }

        setJumlahPenggunaan(counts);
      })
      .catch(() => {});
  }, []);


  /* =========================================================
     PROGRESS
     ========================================================= */

  const pct = ringkasan.total
    ? Math.round(
        ringkasan.terverifikasi /
        ringkasan.total *
        100
      )
    : 0;

  const angka: [StatusBidang, number][] = [
    ['draft', ringkasan.draft],
    ['terkirim', ringkasan.terkirim],
    ['terverifikasi', ringkasan.terverifikasi],
    ['revisi', ringkasan.revisi]
  ];


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="shell">

      {/* =====================================================
          FLOATING HEADER
          ===================================================== */}

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


        {/* USER AREA */}
        <div className="head-user">

          {/* DARK / LIGHT */}
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


          {/* NAMA AKUN */}
          <div className="head-user-info">

            <span className="head-user-role">
              {pengguna.peran}
            </span>

            <strong>
              {pengguna.name}
            </strong>

          </div>


          {/* KELUAR */}
          <form action={keluar}>

            <button
              type="submit"
              className="head-logout"
            >
              KELUAR
            </button>

          </form>

        </div>

      </header>


      {/* =====================================================
          BODY
          ===================================================== */}

      <main className="body">

        <ControlPanel
          terbuka={panel}
          onClose={() => setPanel(false)}
        />

        <div className="mapwrap">

          <button
            type="button"
            className="map-panel-toggle"
            onClick={() => setPanel(true)}
            aria-label="Buka Control Panel"
            title="Control Panel"
          >
            ☰
          </button>


          <MapCanvas />


          {/* =================================================
              PROGRESS
              ================================================= */}

          <div className="progress float">

            <div className="ph">

              <span className="lbl">
                {pewarnaan === 'status'
                  ? 'Progres verifikasi'
                  : 'Penggunaan bidang'}
              </span>

              {pewarnaan === 'status' && (
                <b>{pct}%</b>
              )}

            </div>


            {/* PROGRESS BAR */}
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
                  <div
                    className="li"
                    key={s}
                  >

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
                      <div
                        className="li"
                        key={nama}
                      >

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


          {/* =================================================
              TOAST
              ================================================= */}

          {pesan && (
            <div className="toast">
              {pesan}
            </div>
          )}


          {/* =================================================
              KARTU BIDANG
              ================================================= */}

          {kartu && (
            <KartuBidang
              peran={pengguna.peran}
            />
          )}

        </div>

      </main>

    </div>
  );
}
