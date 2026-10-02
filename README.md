# WebGIS DPPT Bojonegoro

Pendataan bidang tanah terdampak trace jalan 19 km, ROW 26 m, ±950 bidang.
Dokumen perencanaan pengadaan tanah, Kabupaten Bojonegoro.

## Susunan

| Lapisan | Pilihan |
|---|---|
| Antarmuka | Next.js 15 (App Router) · TypeScript · MapLibre GL JS · Zustand |
| Server | API Route Next.js — satu repo, tanpa service terpisah |
| Basis data | PostgreSQL + PostGIS |
| Masuk | Auth.js v5, credentials, peran di JWT |
| Foto & dokumen | Cloudflare R2, bucket privat, unggah lewat presigned URL |
| Ortho / DTM / kontur | PMTiles di R2 |

## Alur verifikasi
draft ──kirim──▶ terkirim ──setujui──▶ terverifikasi
  ▲                  │                        │
  └──── revisi ◀─────┘◀───────koreksi─────────┘
