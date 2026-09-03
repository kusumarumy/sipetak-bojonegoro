export const R2 =
  process.env.NEXT_PUBLIC_R2_BASE_URL ?? "";


/* =========================================================
   MAP
   ========================================================= */

export const MAP = {
  center: [111.879, -7.168] as [number, number],
  zoom: 12.4,
  pitch: 18,
  bearing: 18,
  maxPitch: 75,
};


/* =========================================================
   BASEMAP
   ========================================================= */

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
      `${R2}/orthophoto/tiles/{z}/{x}/{y}.webp`,
    ],

    attribution: "Orthophoto DPPT Bojonegoro 2026",

    minzoom: 15,
    maxzoom: 21,
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


/* =========================================================
   TERRAIN / DTM
   ========================================================= */

export const TERRAIN_OPTIONS = {
  aws: {
    id: "aws",

    label: "AWS Terrarium 30 m",

    tiles: [
      "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
    ],

    encoding: "terrarium" as const,

    minzoom: 0,
    maxzoom: 14,

    bounds: [
      -180,
      -85.0511,
      180,
      85.0511,
    ] as [
      number,
      number,
      number,
      number
    ],

    adjustable: false,
  },

  r2: {
    id: "r2",

    label: "DTM 3 m",

    tiles: [
      `${R2}/dtm/{z}/{x}/{y}.png`,
    ],

    encoding: "terrarium" as const,

    minzoom: 8,
    maxzoom: 16,

    /*
     * Sesuaikan dengan extent DTM Bojonegoro
     * kalau nanti ingin dibatasi.
     */
    bounds: [
      111.5,
      -7.5,
      112.5,
      -6.5,
    ] as [
      number,
      number,
      number,
      number
    ],

    adjustable: false,
  },
} as const;


export type TerrainKey =
  keyof typeof TERRAIN_OPTIONS;
