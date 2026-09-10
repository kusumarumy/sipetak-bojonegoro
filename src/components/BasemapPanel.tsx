'use client';

import { useApp, type Basemap } from '@/store/useApp';

const PILIHAN: {
  id: Basemap;
  label: string;
  icon: string;
}[] = [
  {
    id: 'osm',
    label: 'OSM',
    icon: '🌍',
  },
  {
    id: 'esri',
    label: 'Esri Satellite',
    icon: '🛰️',
  },
  {
    id: 'ortho',
    label: 'Orthophoto',
    icon: '📷',
  },
  {
    id: 'google-hybrid',
    label: 'Google Hybrid',
    icon: '🗺️',
  },
  {
    id: 'google-streets',
    label: 'Google Streets',
    icon: '🚗',
  },
  {
    id: 'opentopo',
    label: 'OpenTopo',
    icon: '⛰️',
  },
];

type Props = {
  onClose: () => void;
};

export default function BasemapPanel({
  onClose,
}: Props) {
  const {
    basemap,
    setBasemap,
  } = useApp();

  const pilih = (id: Basemap) => {
    setBasemap(id);
  };

  return (
    <aside className="basemap-flyout">

      <div className="basemap-flyout-head">

        <div>
          <span className="panel-eyebrow">
            MAP DISPLAY
          </span>

          <h3>Basemap</h3>

          <p>
            Pilih tampilan dasar peta.
          </p>
        </div>

        <button
          type="button"
          className="panel-close"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>

      </div>

      <div className="basemap-grid">

        {PILIHAN.map((item) => {

          const aktif =
            basemap === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={
                `basemap-card${
                  aktif ? ' active' : ''
                }`
              }
              onClick={() =>
                pilih(item.id)
              }
            >

              <span className="basemap-card-icon">
                {item.icon}
              </span>

              <span className="basemap-card-label">
                {item.label}
              </span>

              {aktif && (
                <span className="basemap-check">
                  ✓
                </span>
              )}

            </button>
          );
        })}

      </div>

    </aside>
  );
}
