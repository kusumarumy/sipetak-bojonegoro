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
} as const;

export type TerrainKey =
  keyof typeof TERRAIN_OPTIONS;
