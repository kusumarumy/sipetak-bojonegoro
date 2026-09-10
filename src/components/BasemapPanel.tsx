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

export default function BasemapPanel({ onClose }: Props) {
  const { basemap, setBasemap } = useApp();

  return (
    <aside className="basemap-flyout">

      {/* HEADER */}
      <div className="basemap-flyout-head">

        <div className="basemap-panel-heading">

          <div className="basemap-panel-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M4 5.5L9 3l6 3 5-2.5v15L15 21l-6-3-5 2.5v-15Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M9 3v15M15 6v15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="basemap-panel-text">

            <div className="basemap-panel-title">
              BASEMAP
            </div>

            <div className="basemap-panel-subtitle">
              Tampilan dasar peta
            </div>

          </div>

        </div>

        <button
          type="button"
          className="basemap-panel-close"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>

      </div>

      {/* BODY */}
      <div className="basemap-flyout-body">

        <div className="basemap-grid">

          {PILIHAN.map((item) => {
            const aktif = basemap === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`basemap-card${
                  aktif ? ' active' : ''
                }`}
                onClick={() => setBasemap(item.id)}
              >

                <span className="basemap-card-preview">

                  <span className="basemap-card-icon">
                    {item.icon}
                  </span>

                </span>

                <span className="basemap-card-footer">

                  <span className="basemap-card-label">
                    {item.label}
                  </span>

                  {aktif && (
                    <span className="basemap-check">
                      ✓
                    </span>
                  )}

                </span>

              </button>
            );
          })}

        </div>

      </div>

    </aside>
  );
}
