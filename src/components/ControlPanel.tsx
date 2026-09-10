'use client';

import { useState } from 'react';
import { useApp } from '@/store/useApp';
import { LAYERS } from './layers';

const GROUP_ICONS: Record<string, string> = {
  'Rencana trace': '⌁',
  'Bidang tanah': '▦',
  'Tutupan lahan': '◈',
  'Jaringan & utilitas': '⌁',
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

  const grup = [...new Set(LAYERS.map((l) => l.grup))];

  const [grupTerbuka, setGrupTerbuka] = useState<Record<string, boolean>>({
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

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flyout-header">

        <div className="flyout-header-content">

          <div className="flyout-kicker">
            {mode === 'terrain' ? 'TERRAIN' : 'LAYER'}
          </div>

          <div className="flyout-title">
            {mode === 'terrain'
              ? 'Terrain 3D'
              : 'Pengelolaan Layer'}
          </div>

          <div className="flyout-subtitle">
            {mode === 'terrain'
              ? 'Model elevasi permukaan'
              : 'Pengelolaan data peta'}
          </div>

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


      {/* =====================================================
          TERRAIN
      ===================================================== */}

      {mode === 'terrain' && (
        <div className="flyout-body">

          <section className="terrain-card">

            <div className="terrain-head">

              <div className="terrain-head-left">

                <div className="terrain-symbol">
                  △
                </div>

                <div>
                  <div className="terrain-title">
                    Terrain 3D
                  </div>

                  <div className="terrain-subtitle">
                    Model elevasi permukaan
                  </div>
                </div>

              </div>

              <div className="terrain-status">
                {s.dtm === 'off' ? 'OFF' : 'ON'}
              </div>

            </div>


            <div className="terrain-segment">

              <button
                type="button"
                className={s.dtm === 'off' ? 'active' : ''}
                onClick={() => s.setDTM('off')}
              >
                Nonaktif
              </button>

              <button
                type="button"
                className={s.dtm === 'aws' ? 'active' : ''}
                onClick={() => s.setDTM('aws')}
              >
                AWS 30 m
              </button>

              <button
                type="button"
                className={s.dtm === 'r2' ? 'active' : ''}
                onClick={() => s.setDTM('r2')}
              >
                DTM 3 m
              </button>

            </div>

          </section>

        </div>
      )}


      {/* =====================================================
          LAYER
      ===================================================== */}

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

                const layers = LAYERS.filter(
                  (l) => l.grup === g
                );

                const terbukaGrup = grupTerbuka[g];

                const aktifGrup = layers.filter(
                  (l) => s.layerAktif[l.id]
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
                      onClick={() => toggleGrup(g)}
                      aria-expanded={terbukaGrup}
                    >

                      <div className="layer-group-left">

                        <span
                          className={
                            'group-chevron' +
                            (terbukaGrup
                              ? ' expanded'
                              : '')
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
                                (aktif
                                  ? ' active'
                                  : '')
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
                                  <span>✓</span>
                                </span>

                                <span
                                  className={
                                    'layer-swatch' +
                                    (L.garis
                                      ? ' line'
                                      : '')
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


                              {/* =================================
                                  PROPERTIES BIDANG TANAH
                              ================================= */}

                              {g === 'Bidang tanah' &&
                                L.id === 'bidang' &&
                                aktif && (

                                  <div className="layer-properties">

                                    <div className="property-title">
                                      TAMPILAN
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
                                            s.pewarnaan ===
                                            'status'
                                              ? 'active'
                                              : ''
                                          }
                                          onClick={() =>
                                            s.setPewarnaan(
                                              'status'
                                            )
                                          }
                                        >
                                          Status
                                        </button>

                                        <button
                                          type="button"
                                          className={
                                            s.pewarnaan ===
                                            'penggunaan'
                                              ? 'active'
                                              : ''
                                          }
                                          onClick={() =>
                                            s.setPewarnaan(
                                              'penggunaan'
                                            )
                                          }
                                        >
                                          Penggunaan
                                        </button>

                                      </div>

                                    </div>


                                    <div className="property-divider" />


                                    {/* LABEL */}

                                    <div className="property-block">

                                      <div className="property-label">
                                        Label
                                      </div>

                                      <label className="option-row">

                                        <input
                                          type="checkbox"
                                          checked={
                                            s.labelNomor
                                          }
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
