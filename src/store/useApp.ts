'use client';

import { create } from 'zustand';
import type { Bidang, StatusBidang } from '@/types';

export type Tema = 'auto' | 'light' | 'dark';

export type Basemap =
  | 'osm'
  | 'esri'
  | 'ortho'
  | 'google-hybrid'
  | 'google-streets'
  | 'opentopo';

export type SumberDTM =
  | 'off'
  | 'lidar'
  | 'foto';

export type PewarnaanBidang =
  | 'status'
  | 'penggunaan';

interface AppState {
  tema: Tema;
  basemap: Basemap;
  dtm: SumberDTM;
  exag: number;
  pewarnaan: PewarnaanBidang;
  labelNomor: boolean;
  layerAktif: Record<string, boolean>;
  bidangTerpilih: string | null;
  kartu: Bidang | null;
  memuatKartu: boolean;
  pesan: string | null;

  setTema: (t: Tema) => void;
  setBasemap: (b: Basemap) => void;
  setDTM: (d: SumberDTM) => void;
  setExag: (n: number) => void;
  setPewarnaan: (p: PewarnaanBidang) => void;
  setLabelNomor: (v: boolean) => void;
  toggleLayer: (id: string, v: boolean) => void;
  pilihBidang: (id: string | null) => Promise<void>;
  muatUlangKartu: () => Promise<void>;
  setStatusLokal: (
    id: string,
    s: StatusBidang
  ) => void;
  beriPesan: (p: string | null) => void;
}

export const useApp = create<AppState>((set, get) => ({
  tema: 'auto',
  basemap: 'osm',
  dtm: 'off',
  exag: 1.8,
  pewarnaan: 'status',
  labelNomor: true,

layerAktif: {
  trace_g: true,
  bidang: true,
},

  bidangTerpilih: null,

  kartu: null,

  memuatKartu: false,

  pesan: null,

  setTema: (tema) => {
    localStorage.setItem(
      'dppt-tema',
      tema
    );

    const gelap =
      tema === 'dark' ||
      (
        tema === 'auto' &&
        matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches
      );

    document.documentElement.dataset.theme =
      gelap ? 'dark' : 'light';

    set({ tema });
  },

  setBasemap: (basemap) =>
    set({ basemap }),

  setDTM: (dtm) =>
    set({ dtm }),

  setExag: (exag) =>
    set({ exag }),

  setPewarnaan: (pewarnaan) =>
    set({ pewarnaan }),

  setLabelNomor: (labelNomor) =>
    set({ labelNomor }),

  toggleLayer: (id, v) =>
    set((s) => ({
      layerAktif: {
        ...s.layerAktif,
        [id]: v
      }
    })),

  pilihBidang: async (id) => {
    if (!id) {
      set({
        bidangTerpilih: null,
        kartu: null
      });

      return;
    }

    set({
      bidangTerpilih: id,
      memuatKartu: true
    });

    try {
      const r =
        await fetch(
          `/api/bidang/${id}`
        );

      if (!r.ok) {
        throw new Error(
          await r.text()
        );
      }

      set({
        kartu: await r.json(),
        memuatKartu: false
      });

    } catch (e: any) {

      set({
        memuatKartu: false,

        pesan:
          'Kartu bidang gagal dimuat. ' +
          e.message
      });
    }
  },

  muatUlangKartu: async () => {
    const id =
      get().bidangTerpilih;

    if (id) {
      await get().pilihBidang(id);
    }
  },

  setStatusLokal: (
    id,
    status
  ) =>
    set((s) =>
      s.kartu &&
      s.kartu.id === id
        ? {
            kartu: {
              ...s.kartu,
              status
            }
          }
        : {}
    ),

  beriPesan: (pesan) =>
    set({ pesan })
}));
