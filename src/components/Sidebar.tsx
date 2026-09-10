'use client';

type PanelAktif =
  | 'terrain'
  | 'layer'
  | 'bidang'
  | 'statistika'
  | 'filter'
  | null;

type Props = {
  aktif: PanelAktif;
  onChange: (panel: PanelAktif) => void;
};

function IconTerrain() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 19l6-8 4 5 3-4 5 7H3z" />
      <path d="M8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  );
}

function IconLayer() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 5 8-5" />
    </svg>
  );
}

function IconBidang() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v14H4z" />
      <path d="M9 5v14M4 12h16" />
    </svg>
  );
}

function IconStatistika() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V10" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V8" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
    </svg>
  );
}

const MENU = [
  {
    id: 'terrain' as const,
    label: 'TERRAIN',
    icon: <IconTerrain />,
  },
  {
    id: 'layer' as const,
    label: 'LAYER',
    icon: <IconLayer />,
  },
  {
    id: 'bidang' as const,
    label: 'DAFTAR BIDANG',
    icon: <IconBidang />,
  },
  {
    id: 'statistika' as const,
    label: 'STATISTIKA',
    icon: <IconStatistika />,
  },
  {
    id: 'filter' as const,
    label: 'FILTER',
    icon: <IconFilter />,
  },
];

export default function Sidebar({
  aktif,
  onChange,
}: Props) {
  return (
    <aside className="sidebar">

      <div className="sidebar-menu">

        {MENU.map((item) => {

          const isActive = aktif === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={
                `sidebar-item${isActive ? ' active' : ''}`
              }
              onClick={() =>
                onChange(
                  isActive ? null : item.id
                )
              }
              aria-label={item.label}
            >

              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span className="sidebar-tooltip">
                {item.label}
              </span>

            </button>
          );

        })}

      </div>

    </aside>
  );
}
