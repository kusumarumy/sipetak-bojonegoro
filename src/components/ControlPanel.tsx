'use client';

import { useState } from 'react';
import { useApp } from '@/store/useApp';
import { LAYERS } from './layers';

const GROUP_ICONS: Record<string, string> = {
  'Rencana trace': '⌁',
  'Bidang tanah': '▦',
  'Jaringan irigasi': '≈',
  'Jaringan transportasi': '⇆',
  'Tutupan lahan': '◈',
  'Utilitas': '⌁',
};

const GROUP_ORDER = [
  'Rencana trace',
  'Bidang tanah',
  'Jaringan irigasi',
  'Jaringan transportasi',
  'Tutupan lahan',
  'Utilitas',
];

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
    useState<Record<string, boolean>>({
      'Rencana trace': true,
      'Bidang tanah': true,
      'Tutupan lahan': true,
      'Jaringan & utilitas': true,
    });

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

            <>
              <div className="layer-panel-heading">
  <div className="flyout-kicker">
    LAYER
  </div>

  <div className="flyout-title">
    Pengelolaan Layer
  </div>

  <div className="flyout-subtitle">
    Kelola tampilan dan data peta
  </div>
</div>
            </>

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
                  s.dtm === 'aws'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  s.setDTM('aws')
                }
              >
                <span className="terrain-option-name">
                  DTM Rencana Trace
                </span>

                <span className="terrain-option-resolution">
                  0.5 m
                </span>
              </button>


              {/* DTM KAWASAN */}

              <button
                type="button"
                className={
                  s.dtm === 'r2'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  s.setDTM('r2')
                }
              >
                <span className="terrain-option-name">
                  DTM Kawasan
                </span>

                <span className="terrain-option-resolution">
                  1.5 m
                </span>
              </button>

            </div>

          </section>

        </div>

      )}

      {mode === 'layer' && (

        <div className="flyout-body">

          <section className="layer-card">

            {/* HEADER */}

            <div className="layer-manager-head">

              <div>

                <div className="layer-manager-title">
                  LAYER
                </div>

                <div className="layer-manager-subtitle">
                  Pengelolaan data peta
                </div>

              </div>

              <div className="layer-count">
                {jumlahAktif}/{LAYERS.length}
              </div>

            </div>


            {/* GROUPS */}

            <div className="layer-groups">

              {grup.map((g) => {

  const layers = LAYERS
    .filter((l) => l.grup === g)
    .sort((a, b) =>
      a.nama.localeCompare(
        b.nama,
        'id',
        {
          sensitivity: 'base',
        }
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

                    {/* GROUP HEADER */}

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
                            (
                              terbukaGrup
                                ? ' expanded'
                                : ''
                            )
                          }
                        >
                          ›
                        </span>

                        <span className="group-icon">
                          {GROUP_ICONS[g] ?? '•'}
                        </span>

                        <span className="layer-group-title">
                          {g}
                        </span>

                      </div>

                      <span className="group-count">
                        {aktifGrup > 0
                          ? `${aktifGrup}/${layers.length}`
                          : layers.length}
                      </span>

                    </button>


                    {/* LAYER LIST */}

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

{g === 'Bidang tanah' &&
  L.id === 'bidang' &&
  aktif && (

    <div className="layer-properties">

      <div className="property-title">
        TAMPILAN BIDANG
      </div>


      {/* PEWARNAAN */}

      <div className="property-block">

        <div className="property-label">
          Pewarnaan bidang
        </div>

        <div className="style-segment">

          <button
            type="button"
            className={
              s.pewarnaan === 'status'
                ? 'active'
                : ''
            }
            onClick={() =>
              s.setPewarnaan('status')
            }
          >
            STATUS
          </button>

          <button
            type="button"
            className={
              s.pewarnaan === 'penggunaan'
                ? 'active'
                : ''
            }
            onClick={() =>
              s.setPewarnaan('penggunaan')
            }
          >
            PENGGUNAAN
          </button>

        </div>

      </div>


      {/* LABEL */}

      <div className="property-block label-block">

        <div className="property-label">
          Label
        </div>

        <label className="option-row">

          <input
            type="checkbox"
            checked={s.labelNomor}
            onChange={(e) =>
              s.setLabelNomor(
                e.target.checked
              )
            }
          />

          <span className="gis-check small">
            <span>✓</span>
          </span>

          <span>
            Nomor bidang
          </span>

        </label>

      </div>

    </div>

)}

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


          {/* FOOTER */}

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
