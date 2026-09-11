'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import ControlPanel from './ControlPanel';
import Sidebar from './Sidebar';
import KartuBidang from './KartuBidang';
import BasemapPanel from './BasemapPanel';
import DaftarBidang from './DaftarBidang';
import Statistika from './Statistika';
import FilterPanel from './FilterPanel';
import { useApp } from '@/store/useApp';

import {
  STATUS_LABEL,
  STATUS_WARNA,
  type Peran,
  type StatusBidang,
} from '@/types';

import { WARNA_PENGGUNAAN } from './layers';
import logoBojonegoro from '../../data/icon/bojonegoro.png';

const MapCanvas = dynamic(
  () => import('./MapCanvas'),
  { ssr: false }
);

type Ringkasan = {
  total: number;
  draft: number;
  terkirim: number;
  terverifikasi: number;
  revisi: number;
  haTerdampak: number;
  km: number;
};

type PanelAktif =
  | 'basemap'
  | 'terrain'
  | 'layer'
  | 'bidang'
  | 'statistika'
  | 'filter'
  | null;

export default function Peta({
  pengguna,
  ringkasan,
  keluar,
}: {
  pengguna: {
    name: string;
    peran: Peran;
  };
  ringkasan: Ringkasan;
  keluar: () => Promise<void>;
}) {
  // =========================================================
  // APP STATE
  // =========================================================

  const {
    kartu,
    pesan,
    beriPesan,
    pewarnaan,
  } = useApp();

  // =========================================================
  // PANEL
  // =========================================================

  const [panelAktif, setPanelAktif] =
    useState<PanelAktif>(null);

  // =========================================================
  // TEMA
  // =========================================================

  const [tema, setTema] =
    useState<'light' | 'dark'>('light');

  // =========================================================
  // JUMLAH PENGGUNAAN
  // =========================================================

  const [jumlahPenggunaan, setJumlahPenggunaan] =
    useState<Record<string, number>>({
      Kosong: 0,
      'Tanah Persawahan': 0,
      'Tanah Perkampungan': 0,
      'Tanah Perumahan': 0,
      'Lain-lain': 0,
      'Tanah Tidak Ada Bangunan': 0,
      'Belum diisi': 0,
    });

  // =========================================================
  // LOAD TEMA
  // =========================================================

  useEffect(() => {
    const saved =
      localStorage.getItem('dppt-tema');

    const current =
      saved === 'dark' ||
      saved === 'light'
        ? saved
        : 'light';

    setTema(current);

    document.documentElement.dataset.theme =
      current;
  }, []);

  // =========================================================
  // TOGGLE TEMA
  // =========================================================

  const toggleTema = () => {
    const next =
      tema === 'dark'
        ? 'light'
        : 'dark';

    setTema(next);

    localStorage.setItem(
      'dppt-tema',
      next
    );

    document.documentElement.dataset.theme =
      next;
  };

  // =========================================================
  // TOAST
  // =========================================================

  useEffect(() => {
    if (!pesan) return;

    const t = setTimeout(() => {
      beriPesan(null);
    }, 3200);

    return () => {
      clearTimeout(t);
    };
  }, [pesan, beriPesan]);

  // =========================================================
  // JUMLAH PENGGUNAAN
  // =========================================================

  useEffect(() => {
    fetch('/api/bidang')
      .then((r) => r.json())
      .then((fc) => {
        const counts: Record<string, number> = {
          Kosong: 0,
          'Tanah Persawahan': 0,
          'Tanah Perkampungan': 0,
          'Tanah Perumahan': 0,
          'Lain-lain': 0,
          'Tanah Tidak Ada Bangunan': 0,
          'Belum diisi': 0,
        };

        for (
          const f of fc.features ?? []
        ) {
          const value =
            f.properties?.penggunaan;

          if (
            value === null ||
            value === undefined ||
            value === ''
          ) {
            counts['Belum diisi']++;
          } else if (
            value in counts
          ) {
            counts[value]++;
          }
        }

        setJumlahPenggunaan(counts);
      })
      .catch(() => {});
  }, []);

  // =========================================================
  // RINGKASAN STATUS
  // =========================================================

  const angka: [
    StatusBidang,
    number
  ][] = [
    ['draft', ringkasan.draft],
    ['terkirim', ringkasan.terkirim],
    ['terverifikasi', ringkasan.terverifikasi],
    ['revisi', ringkasan.revisi],
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="shell">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="bar">

        <div className="head-brand">

          <div className="head-logo-wrap">
            <img
              src={logoBojonegoro.src}
              alt="Logo Kabupaten Bojonegoro"
              className="head-logo"
            />
          </div>

          <div className="head-brand-text">

            <div className="head-title-row">
              <span className="head-eyebrow">
                DPPT KABUPATEN BOJONEGORO
              </span>
            </div>

            <span className="head-app-name">
              SISTEM INFORMASI BIDANG TANAH TERDAMPAK JALUR LINGKAR SELATAN
            </span>

          </div>

        </div>

        <div className="head-user">

          {/* THEME */}

          <button
            type="button"
            className={`theme-switch ${
              tema === 'dark'
                ? 'dark'
                : 'light'
            }`}
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

            <span className="theme-switch-track">

              <span className="theme-switch-thumb">
                {tema === 'dark'
                  ? '☾'
                  : '☀'}
              </span>

            </span>

          </button>

          {/* USER */}

          <div className="head-user-profile">

            <div className="head-user-avatar">

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >

                <path
                  d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                  fill="currentColor"
                />

                <path
                  d="M4.5 21a7.5 7.5 0 0 1 15 0"
                  fill="currentColor"
                />

              </svg>

            </div>

            <div className="head-user-info">

              <span className="head-user-role">
                {pengguna.peran}
              </span>

              <strong>
                {pengguna.name}
              </strong>

            </div>

          </div>

          {/* SIGN OUT */}

          <form action={keluar}>

            <button
              type="submit"
              className="head-logout"
            >

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >

                <path
                  d="M10 17l5-5-5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M15 12H3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <path
                  d="M21 3v18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

              </svg>

              <span>
                SIGN OUT
              </span>

            </button>

          </form>

        </div>

      </header>

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <Sidebar
        aktif={panelAktif}
        onChange={setPanelAktif}
      />

      {/* =====================================================
          BASEMAP
          ===================================================== */}

      {panelAktif === 'basemap' && (
        <BasemapPanel
          onClose={() =>
            setPanelAktif(null)
          }
        />
      )}

      {/* =====================================================
          DAFTAR BIDANG
          ===================================================== */}

      {panelAktif === 'bidang' && (
        <DaftarBidang
          onClose={() =>
            setPanelAktif(null)
          }
        />
      )}

      {/* =====================================================
          STATISTIKA
          ===================================================== */}

      {panelAktif === 'statistika' && (
        <Statistika
          onClose={() =>
            setPanelAktif(null)
          }
        />
      )}

      {/* =====================================================
          TERRAIN / LAYER
          ===================================================== */}

      <ControlPanel
        mode={
          panelAktif === 'terrain' ||
          panelAktif === 'layer'
            ? panelAktif
            : null
        }
        onClose={() =>
          setPanelAktif(null)
        }
      />
{/* =====================================================
    FILTER
    ===================================================== */}

{panelAktif === 'filter' && (
  <FilterPanel
    onClose={() =>
      setPanelAktif(null)
    }
  />
)}
      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="body">

        <div className="mapwrap">

          <MapCanvas />

          {/* =================================================
              LEGEND
              ================================================= */}

          <div className="legend">

            {pewarnaan === 'status' ? (

              angka.map(
                ([s, n]) => (
                  <div
                    className="li"
                    key={s}
                  >

                    <span
                      className="swatch"
                      style={{
                        background:
                          STATUS_WARNA[s],
                      }}
                    />

                    <span>
                      {STATUS_LABEL[s]}
                    </span>

                    <b>
                      {n.toLocaleString(
                        'id-ID'
                      )}
                    </b>

                  </div>
                )
              )

            ) : (

              <>

                {Object.entries(
                  WARNA_PENGGUNAAN
                ).map(
                  ([nama, warna]) => (
                    <div
                      className="li"
                      key={nama}
                    >

                      <span
                        className="swatch"
                        style={{
                          background:
                            warna,
                        }}
                      />

                      <span>
                        {nama}
                      </span>

                      <b>
                        {(
                          jumlahPenggunaan[
                            nama
                          ] ?? 0
                        ).toLocaleString(
                          'id-ID'
                        )}
                      </b>

                    </div>
                  )
                )}

                {/* BELUM DIISI */}

                <div className="li">

                  <span
                    className="swatch"
                    style={{
                      background: '#888',
                    }}
                  />

                  <span>
                    Belum diisi
                  </span>

                  <b>
                    {(
                      jumlahPenggunaan[
                        'Belum diisi'
                      ] ?? 0
                    ).toLocaleString(
                      'id-ID'
                    )}
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

      </main>

    </div>
  );
}
