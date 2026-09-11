'use client';

type PanelAktif =
  | 'terrain'
  | 'basemap'
  | 'layer'
  | 'bidang'
  | 'statistika'
  | 'filter'
    'search'
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
function IconBasemap() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v14H4z" />
      <path d="M4 15l5-5 4 4 3-3 4 4" />
      <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
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

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
      />
      <path d="M16 16l5 5" />
    </svg>
  );
}

const MENU = [
  {
    id: 'terrain' as const,
    label: 'Terrain 3D',
    icon: <IconTerrain />,
  },
    {
    id: 'basemap' as const,
    label: 'BASEMAP',
    icon: <IconBasemap />,
  },
  {
    id: 'layer' as const,
    label: 'Layer',
    icon: <IconLayer />,
  },
  {
    id: 'bidang' as const,
    label: 'Daftar bidang',
    icon: <IconBidang />,
  },
  {
    id: 'statistika' as const,
    label: 'Statistika',
    icon: <IconStatistika />,
  },
  {
    id: 'filter' as const,
    label: 'Filter',
    icon: <IconFilter />,
  },
  {
    id: 'search' as const,
    label: 'Pencarian',
    icon: <IconSearch />,
  }
];

export default function Sidebar({
  aktif,
  onChange,
}: Props) {
  return (
    <aside className="sidebar" aria-label="Kontrol peta">

      <div className="sidebar-menu">

        {MENU.map((item) => {
          const isActive = aktif === item.id;

          return (
<button
  key={item.id}
  type="button"
  className={`sidebar-item${isActive ? ' active' : ''}`}
  onClick={() => {
    onChange(isActive ? null : item.id);
  }}
  aria-label={item.label}
  aria-pressed={isActive}
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
