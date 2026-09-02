'use client';

import { useApp } from '@/store/useApp';
import { LAYERS } from './layers';

export default function ControlPanel({
  terbuka,
}: {
  terbuka: boolean;
}) {
  const s = useApp();

  const grup = [...new Set(LAYERS.map((l) => l.grup))];

  return (
    <aside className={'panel' + (terbuka ? ' open' : '')}>

      <div className="terrain-card">

        <div className="terrain-title">
          <span className="terrain-icon">△</span>
          <strong>Terrain 3D</strong>
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
            className={s.dtm === 'lidar' ? 'active' : ''}
            onClick={() => s.setDTM('lidar')}
          >
            AWS 30 m
          </button>

          <button
            type="button"
            className={s.dtm === 'foto' ? 'active' : ''}
            onClick={() => s.setDTM('foto')}
          >
            DTM 3 m
          </button>

        </div>

      </div>
      <div className="layer-card">

        <div className="layer-card-title">
          LAYER
        </div>

        {grup.map((g) => (
          <div className="layer-group" key={g}>

            <div className="layer-group-title">
              {g}
            </div>

            <div className="layer-list">

              {LAYERS
                .filter((l) => l.grup === g)
                .map((L) => (

                  <div className="row" key={L.id}>

                    <label>

                      <input
                        type="checkbox"
                        checked={!!s.layerAktif[L.id]}
                        onChange={(e) =>
                          s.toggleLayer(
                            L.id,
                            e.target.checked
                          )
                        }
                      />

                      {/* Simbol layer */}
                      <span
                        className={
                          'swatch' +
                          (L.garis ? ' ln' : '')
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

                      {/* Nama yang tampil di panel */}
                      <span className="nm">
                        {L.nama}
                      </span>

                    </label>

                  </div>

                ))}

            </div>

          </div>
        ))}

      </div>

      <div className="sec">

        <span className="lbl">
          Tampilan bidang
        </span>

        <div className="seg">

          {(
            [
              ['status', 'Status'],
              ['penggunaan', 'Penggunaan'],
            ] as const
          ).map(([v, n]) => (

            <button
              key={v}
              type="button"
              aria-pressed={s.pewarnaan === v}
              onClick={() => s.setPewarnaan(v)}
            >
              {n}
            </button>

          ))}

        </div>

        <div
          className="row"
          style={{ marginTop: 8 }}
        >

          <label>

            <input
              type="checkbox"
              checked={s.labelNomor}
              onChange={(e) =>
                s.setLabelNomor(
                  e.target.checked
                )
              }
            />

            <span className="nm">
              Nomor bidang
            </span>

          </label>

        </div>

      </div>

    </aside>
  );
}
