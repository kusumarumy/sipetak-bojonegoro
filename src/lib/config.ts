export const R2 =
  process.env.NEXT_PUBLIC_R2_BASE_URL ??
  "https://dppt-bojonegoro.ruli-andaru.workers.dev";

export const MAP = {
  center: [111.879, -7.168] as [number, number],
  zoom: 12.4,
  pitch: 18,
  bearing: 18,
  maxPitch: 85,
};

export type Basemap = {
  id:
    | "osm"
    | "esri"
    | "ortho"
    | "google-hybrid"
    | "google-streets"
    | "opentopo";
  labelKey: string;
  tiles: string[];
  attribution: string;
  minzoom?: number;
  maxzoom?: number;
};

export const BASEMAPS: Basemap[] = [
  {
    id: "osm",
    labelKey: "bm_map",
    tiles: [
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    ],
    attribution: "© OpenStreetMap",
    maxzoom: 19,
  },
  {
    id: "esri",
    labelKey: "bm_sat",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Esri, Maxar",
    maxzoom: 19,
  },
  {
    id: "ortho",
    labelKey: "bm_ortho",
    tiles: [
      `${R2}/orthophoto/{z}/{x}/{y}.png`,
    ],
    attribution: "Orthophoto DPPT Bojonegoro 2026",
    minzoom: 13,
    maxzoom: 20,
  },
  {
    id: "google-hybrid",
    labelKey: "bm_hybrid",
    tiles: [
      "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    ],
    attribution: "© Google Maps",
    maxzoom: 20,
  },
  {
    id: "google-streets",
    labelKey: "bm_streets",
    tiles: [
      "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    ],
    attribution: "© Google Maps",
    maxzoom: 20,
  },
  {
    id: "opentopo",
    labelKey: "bm_opentopo",
    tiles: [
      "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    ],
    attribution: "© OpenTopoMap",
    maxzoom: 17,
  },
];

export const TERRAIN_OPTIONS = {
  trace: {
    id: "trace",
    label: "DTM Rencana Trace",
    tiles: [
      `${R2}/dtm_trase/{z}/{x}/{y}.png`,
    ],
    encoding: "terrarium" as const,
    minzoom: 10,
    maxzoom: 18,
    adjustable: false,
  },

  kawasan: {
    id: "kawasan",
    label: "DTM Kawasan",
    tiles: [
      `${R2}/dtm_kawasan/{z}/{x}/{y}.png`,
    ],
    encoding: "terrarium" as const,
    minzoom: 10,
    maxzoom: 18,
    adjustable: false,
  },
} as const;

export type TerrainKey =
  keyof typeof TERRAIN_OPTIONS;
