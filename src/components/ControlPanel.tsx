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

export default function ControlPanel({
  terbuka,
  onClose,
}: {
  terbuka: boolean;
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

return (
  <aside className={'panel' + (terbuka ? ' open' : '')}>

    <button
      type="button"
      className="panel-close"
      onClick={onClose}
      aria-label="Tutup panel"
      title="Tutup panel"
    >
      ×
    </button>

    {/* isi Control Panel */}
      <section className="terrain-card">
        <div className="terrain-head">
          <div className="terrain-head-left">
            <div className="terrain-symbol">△</div>

            <div>
              <div className="terrain-title">Terrain 3D</div>
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

        <div className="layer-groups">
          {grup.map((g) => {
            const layers = LAYERS.filter((l) => l.grup === g);
            const terbukaGrup = grupTerbuka[g];
            const aktifGrup = layers.filter(
              (l) => s.layerAktif[l.id]
            ).length;

            return (
              <div className="layer-group" key={g}>

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
                        (terbukaGrup ? ' expanded' : '')
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

                {terbukaGrup && (
                  <div className="layer-list">
                    {layers.map((L) => {
                      const aktif = !!s.layerAktif[L.id];

                      return (
                        <div
                          className={
                            'layer-item' +
                            (aktif ? ' active' : '')
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
                                (L.garis ? ' line' : '')
                              }
                              style={
                                L.garis
                                  ? {
                                      borderTopColor: L.warna,
                                    }
                                  : {
                                      background: L.warna,
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
                                  TAMPILAN
                                </div>

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
                                      Status
                                    </button>

                                    <button
                                      type="button"
                                      className={
                                        s.pewarnaan === 'penggunaan'
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

                                <div className="property-block">
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

      <div className="panel-footer">
        <span className="footer-dot" />
        <span>
          {jumlahAktif} layer aktif
        </span>
      </div>
    </aside>
  );
}
