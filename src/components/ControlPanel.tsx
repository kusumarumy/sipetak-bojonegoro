'use client';

import { useState } from 'react';
import { useApp } from '@/store/useApp';
import { LAYERS } from './layers';

const GROUP_ORDER = [
  'Rencana Trase',
  'Bidang Tanah',
  'Hipsografi',
  'Jaringan Irigasi',
  'Jaringan Transportasi',
  'Tutupan Lahan',
  'Utilitas',
];
const GROUP_ICONS: Record<
  string,
  { path: string; color: string }
> = {
  'Rencana Trase': {
    path: 'M4 18L9 13L13 15L20 6',
    color: '#E53935',
  },

  'Bidang Tanah': {
    path: 'M5 5H19V19H5Z M9 5V19 M15 5V19 M5 9H19 M5 15H19',
    color: '#F9A825',
  },

  'Hipsografi': {
    path: 'M3 19L9 9L13 14L16 10L21 19 M5 17H19',
    color: '#795548',
  },

  'Jaringan Irigasi': {
    path: 'M3 8C6 5 8 11 11 8C14 5 16 11 21 7 M3 14C6 11 8 17 11 14C14 11 16 17 21 13',
    color: '#1E88E5',
  },

  'Jaringan Transportasi': {
    path: 'M4 6H20 M4 12H20 M4 18H20 M8 4L4 6L8 8 M16 10L20 12L16 14 M8 16L4 18L8 20',
    color: '#546E7A',
  },

  'Tutupan Lahan': {
    path: 'M12 3L20 8L17 18L7 18L4 8Z M4 8L12 12L20 8 M12 12V21',
    color: '#43A047',
  },

  'Utilitas': {
    path: 'M13 2L5 13H11L10 22L19 10H13Z',
    color: '#8E24AA',
  },
};

type PanelMode = 'terrain' | 'layer' | null;

export default function ControlPanel({
  mode,
  onClose,
}: {
  mode: PanelMode;
  onClose: () => void;
}) {
  const s = useApp();

  const grup = GROUP_ORDER.filter((g) =>
  LAYERS.some((l) => l.grup === g)
);
const [grupTerbuka, setGrupTerbuka] =
  useState<Record<string, boolean>>({});
  const toggleGrup = (nama: string) => {
    setGrupTerbuka((prev) => ({
      ...prev,
      [nama]: !prev[nama],
    }));
  };

  const jumlahAktif = LAYERS.filter(
    (l) => s.layerAktif[l.id]
  ).length;

  if (!mode) return null;

  return (
    <aside className="flyout-panel">

      <div className="flyout-header">

        <div className="flyout-header-content">

          {mode === 'terrain' ? (

            <div className="terrain-panel-heading">

              <div className="terrain-panel-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 19.5L9.5 9l4 6 2.5-3.5 4.5 8H3.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="terrain-panel-text">

                <div className="terrain-panel-title">
                  TERRAIN 3D
                </div>

                <div className="terrain-panel-subtitle">
                  Model elevasi permukaan
                </div>

              </div>

            </div>

          ) : (

  <div className="layer-panel-heading">

    <div className="layer-panel-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M4 12l8 4 8-4" />
        <path d="M4 16l8 5 8-5" />
      </svg>
    </div>

    <div className="layer-panel-text">

      <div className="layer-panel-title">
        LAYER
      </div>

      <div className="layer-panel-subtitle">
        Kelola tampilan dan data peta
      </div>

    </div>

  </div>

)}

        </div>

        <button
          type="button"
          className="flyout-close"
          onClick={onClose}
          aria-label="Tutup"
          title="Tutup"
        >
          ×
        </button>

      </div>

      {mode === 'terrain' && (

        <div className="flyout-body terrain-body">

          <section className="terrain-card">

            <div className="terrain-segment">

              {/* NONAKTIF */}

              <button
                type="button"
                className={
                  s.dtm === 'off'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  s.setDTM('off')
                }
              >
                <span className="terrain-option-name">
                  Nonaktif
                </span>
              </button>


              {/* DTM RENCANA TRACE */}

              <button
                type="button"
                className={
                  s.dtm === 'trace'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  s.setDTM('trace')
                }
              >
                <span className="terrain-option-name">
                  DTM Rencana Trase G
                </span>

                <span className="terrain-option-resolution">
                  0.5 m
                </span>
              </button>

              <button
                type="button"
                className={
                  s.dtm === 'aws'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  s.setDTM('aws')
                }
              >
                <span className="terrain-option-name">
                  AWS Terrarium
                </span>
              
                <span className="terrain-option-resolution">
                  30 m
                </span>
              </button>

            </div>

          </section>

        </div>

      )}

      {mode === 'layer' && (

        <div className="flyout-body">

          <section className="layer-card">

            <div className="layer-groups">

{grup.map((g) => {

  const layers = LAYERS
    .filter((l) => l.grup === g)
    .sort((a, b) =>
      a.nama.localeCompare(
        b.nama,
        'id',
        { sensitivity: 'base' }
      )
    );

                const terbukaGrup =
                  grupTerbuka[g];

                const aktifGrup =
                  layers.filter(
                    (l) =>
                      s.layerAktif[l.id]
                  ).length;

                return (
                  <div
                    className="layer-group"
                    key={g}
                  >

                    <button
                      type="button"
                      className="layer-group-head"
                      onClick={() =>
                        toggleGrup(g)
                      }
                      aria-expanded={
                        terbukaGrup
                      }
                    >

                      <div className="layer-group-left">

                     <span
  className={
    'group-chevron' +
    (terbukaGrup ? ' expanded' : '')
  }
>
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M6 3l5 5-5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</span>

<span
  className="group-icon"
  style={{
    color:
      GROUP_ICONS[g]?.color ?? 'currentColor',
  }}
>
  {GROUP_ICONS[g] ? (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {GROUP_ICONS[g].path
        .split(' M')
        .map((path, i) => (
          <path
            key={i}
            d={(i === 0 ? path : `M${path}`)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
    </svg>
  ) : (
    '•'
  )}
</span>
                        <span className="layer-group-title">
                          {g}
                        </span>

                      </div>

<span className="group-count">
  {layers.length}
</span>

                    </button>

                    {terbukaGrup && (

                      <div className="layer-list">

                        {layers.map((L) => {

                          const aktif =
                            !!s.layerAktif[L.id];

                          return (

                            <div
                              className={
                                'layer-item' +
                                (
                                  aktif
                                    ? ' active'
                                    : ''
                                )
                              }
                              key={L.id}
                            >

                              <label className="layer-row">

                                <input
                                  type="checkbox"
                                  checked={aktif}
                                  onChange={(e) =>
                                    s.toggleLayer(
                                      L.id,
                                      e.target.checked
                                    )
                                  }
                                />

                                <span className="gis-check">
                                  <span>
                                    ✓
                                  </span>
                                </span>

                                <span
                                  className={
                                    'layer-swatch' +
                                    (
                                      L.garis
                                        ? ' line'
                                        : ''
                                    )
                                  }
                                  style={
                                    L.garis
                                      ? {
                                          borderTopColor:
                                            L.warna,
                                        }
                                      : {
                                          background:
                                            L.warna,
                                        }
                                  }
                                />

                                <span className="layer-name">
                                  {L.nama}
                                </span>

                              </label>


                            </div>

                          );

                        })}

                      </div>

                    )}

                  </div>
                );

              })}

            </div>

          </section>

          <div className="panel-footer">

            <span className="footer-dot" />

            <span>
              {jumlahAktif} layer aktif
            </span>

          </div>

        </div>

      )}

    </aside>
  );
}
