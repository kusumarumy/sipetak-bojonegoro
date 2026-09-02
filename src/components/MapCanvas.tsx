'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { Map as MLMap, Popup } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { useApp, type Basemap } from '@/store/useApp';
import {
  LAYERS,
  KONTUR,
  DTM,
  ORTHO,
  WARNA_PENGGUNAAN
} from './layers';
import {
  STATUS_WARNA,
  STATUS_LABEL,
  type StatusBidang
} from '@/types';

const pmtiles = new Protocol();
let protokolTerpasang = false;

/**
 * Ortho, DTM, dan kontur belum tentu sudah selesai di-tiling.
 * URL yang masih berisi contoh dianggap belum ada,
 * sehingga peta tetap tampil dengan basemap biasa.
 */
const siap = (url?: string) =>
  !!url &&
  !url.includes('contoh.id') &&
  (url.startsWith('http') || url.startsWith('/'));

/* Status ketersediaan data */
const ADA_ORTHO = siap(ORTHO);

const ADA_DTM = {
  lidar: siap(DTM.lidar),
  foto: siap(DTM.foto)
};

const ADA_KONTUR = {
  lidar: siap(KONTUR.lidar.url),
  foto: siap(KONTUR.foto.url)
};

/**
 * Kontrol pergantian basemap.
 *
 * Urutan:
 * ortho → osm → none → ortho
 */
class BasemapControl implements maplibregl.IControl {
  private container: HTMLDivElement;
  private current: Basemap;
  private onChange: (value: Basemap) => void;

  constructor(
    current: Basemap,
    onChange: (value: Basemap) => void
  ) {
    this.current = current;
    this.onChange = onChange;
    this.container = document.createElement('div');
  }

  onAdd() {
    this.container.className =
      'maplibregl-ctrl maplibregl-ctrl-group';

    const button = document.createElement('button');

    button.type = 'button';
    button.title = 'Basemap';
    button.setAttribute('aria-label', 'Basemap');
    button.innerHTML = '🗺️';

    button.onclick = () => {
      const next: Basemap =
        this.current === 'ortho'
          ? 'osm'
          : this.current === 'osm'
            ? 'none'
            : 'ortho';

      this.current = next;
      this.onChange(next);
    };

    this.container.appendChild(button);

    return this.container;
  }

  onRemove() {
    this.container.remove();
  }
}

export default function MapCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const terpilihRef = useRef<number | null>(null);

  const {
    basemap,
    setBasemap,
    dtm,
    exag,
    pewarnaan,
    labelNomor,
    layerAktif,
    tema,
    pilihBidang,
    beriPesan
  } = useApp();

  /**
   * Inisialisasi map.
   */
  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    if (!protokolTerpasang) {
      maplibregl.addProtocol('pmtiles', pmtiles.tile);
      protokolTerpasang = true;
    }

    /**
     * ==========================
     * SOURCES
     * ==========================
     */
    const sources: any = {
      osm: {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap'
      }
    };

    if (ADA_ORTHO) {
      sources.ortho = {
        type: 'raster',
        url: `pmtiles://${ORTHO}`,
        tileSize: 256,
        attribution: 'Orthophoto DPPT Bojonegoro 2026'
      };
    }

    /**
     * Dua DTM dipasang sebagai sumber terpisah.
     * MapLibre hanya dapat mengaktifkan satu terrain
     * pada satu waktu.
     */
    if (ADA_DTM.lidar) {
      sources.dem_lidar = {
        type: 'raster-dem',
        url: `pmtiles://${DTM.lidar}`,
        tileSize: 512,
        encoding: 'mapbox'
      };
    }

    if (ADA_DTM.foto) {
      sources.dem_foto = {
        type: 'raster-dem',
        url: `pmtiles://${DTM.foto}`,
        tileSize: 512,
        encoding: 'mapbox'
      };
    }

    if (ADA_KONTUR.lidar) {
      sources.kontur_lidar = {
        type: 'vector',
        url: `pmtiles://${KONTUR.lidar.url}`
      };
    }

    if (ADA_KONTUR.foto) {
      sources.kontur_foto = {
        type: 'vector',
        url: `pmtiles://${KONTUR.foto.url}`
      };
    }

    /**
     * ==========================
     * INITIAL LAYERS
     * ==========================
     */
    const layersAwal: any[] = [
      {
        id: 'bg',
        type: 'background',
        paint: {
          'background-color': '#0E1720'
        }
      },

      {
        id: 'bm-osm',
        type: 'raster',
        source: 'osm',

        layout: {
          visibility: ADA_ORTHO
            ? 'none'
            : 'visible'
        },

        paint: {
          'raster-saturation': -0.5
        }
      }
    ];

    if (ADA_ORTHO) {
      layersAwal.push({
        id: 'bm-ortho',
        type: 'raster',
        source: 'ortho'
      });
    }

    /**
     * ==========================
     * MAP
     * ==========================
     */
    const map = new maplibregl.Map({
      container: ref.current,

      center: [111.879, -7.168],
      zoom: 12.4,
      bearing: 18,
      maxPitch: 75,

      attributionControl: {
        compact: true
      },

      style: {
        version: 8,

        glyphs:
          'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',

        sources,
        layers: layersAwal
      }
    });

    mapRef.current = map;

    /**
     * ==========================
     * MAP CONTROLS
     * ==========================
     */

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true
      }),
      'top-right'
    );

    /**
     * Basemap control
     */
    const basemapControl = new BasemapControl(
      basemap,
      (value) => setBasemap(value)
    );

    map.addControl(
      basemapControl,
      'top-right'
    );

    /**
     * Scale
     */
    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 110,
        unit: 'metric'
      }),
      'bottom-right'
    );

    /**
     * ==========================
     * MAP LOAD
     * ==========================
     */
    map.on('load', () => {

      /**
       * ==========================
       * KONTUR
       * ==========================
       */
      for (
        const [k, def]
        of [
          ['lidar', KONTUR.lidar],
          ['foto', KONTUR.foto]
        ] as const
      ) {
        if (!ADA_KONTUR[k]) continue;

        map.addLayer({
          id: def.id,

          type: 'line',

          source:
            k === 'lidar'
              ? 'kontur_lidar'
              : 'kontur_foto',

          'source-layer': 'kontur',

          minzoom: 13,

          layout: {
            visibility: 'none'
          },

          paint: {
            'line-color': def.warna,

            'line-width': [
              'case',
              ['==', ['get', 'mayor'], 1],
              1.2,
              0.55
            ],

            'line-opacity': 0.7
          }
        });
      }

      /**
       * ==========================
       * LAYERS
       * ==========================
       */
      for (const L of LAYERS) {
        map.addSource(L.id, {
          type: 'geojson',
          data: `/api/layers/${L.sumber}`
        });

        const vis =
          L.bawaan
            ? 'visible'
            : 'none';

        /**
         * Polygon
         */
        if (L.tipe === 'fill') {

          map.addLayer({
            id: L.id,

            type: 'fill',

            source: L.id,

            layout: {
              visibility: vis
            },

            paint: {
              'fill-color': L.warna,

              'fill-opacity':
                L.opasitas ?? 0.45
            }
          });

          map.addLayer({
            id: L.id + '-ln',

            type: 'line',

            source: L.id,

            layout: {
              visibility: vis
            },

            paint: {
              'line-color': L.warna,

              'line-width': 1.2,

              'line-opacity': 0.85
            }
          });

        /**
         * Line
         */
        } else if (L.tipe === 'line') {

          map.addLayer({
            id: L.id,

            type: 'line',

            source: L.id,

            layout: {
              visibility: vis
            },

            paint: {
              'line-color': L.warna,

              'line-width':
                L.lebar ?? 2,

              ...(L.dash
                ? {
                    'line-dasharray':
                      L.dash
                  }
                : {})
            }
          });

        /**
         * Point
         */
        } else {

          map.addLayer({
            id: L.id,

            type: 'circle',

            source: L.id,

            layout: {
              visibility: vis
            },

            paint: {
              'circle-radius': 4,

              'circle-color': L.warna,

              'circle-stroke-width': 1.5,

              'circle-stroke-color':
                '#0E1720'
            }
          });
        }
      }

      /**
       * ==========================
       * BIDANG TANAH
       * ==========================
       *
       * GeoJSON dari database,
       * bukan tile, agar hasil edit
       * langsung tampil.
       */
      map.addSource('bidang', {
        type: 'geojson',

        data: '/api/bidang',

        promoteId: 'no'
      });

      /**
       * Fill bidang
       */
      map.addLayer({
        id: 'bidang',

        type: 'fill',

        source: 'bidang',

        paint: {
          'fill-color':
            ekspresiStatus(),

          'fill-opacity': [
            'case',

            [
              'boolean',
              ['feature-state', 'sel'],
              false
            ],

            0.88,

            [
              'boolean',
              ['feature-state', 'hov'],
              false
            ],

            0.74,

            0.58
          ]
        }
      });

      /**
       * Border bidang
       */
      map.addLayer({
        id: 'bidang-ln',

        type: 'line',

        source: 'bidang',

        paint: {
          'line-color': [
            'case',

            [
              'boolean',
              ['feature-state', 'sel'],
              false
            ],

            '#FFFFFF',

            'rgba(14,23,32,.85)'
          ],

          'line-width': [
            'case',

            [
              'boolean',
              ['feature-state', 'sel'],
              false
            ],

            2.6,

            0.7
          ]
        }
      });

      /**
       * Label nomor bidang
       */
      map.addLayer({
        id: 'bidang-lb',

        type: 'symbol',

        source: 'bidang',

        minzoom: 15.2,

        layout: {
          'text-field': [
            'get',
            'no'
          ],

          'text-size': 10,

          'text-font': [
            'Open Sans Regular'
          ]
        },

        paint: {
          'text-color': '#0E1720',

          'text-halo-color':
            'rgba(255,255,255,.85)',

          'text-halo-width': 1.1
        }
      });

      /**
       * Tema
       */
      warnaiTema(map);

      /**
       * Interaksi bidang
       */
      pasangInteraksi(map);

      /**
       * Zoom ke trace
       */
      zoomKeTrace(map);
    });

    /**
     * ==========================
     * ERROR
     * ==========================
     */
    map.on('error', (e) => {
      console.warn(
        'MapLibre:',
        e.error?.message ?? e
      );
    });

    /**
     * ==========================
     * CLEANUP
     * ==========================
     */
    return () => {
      popupRef.current?.remove();

      map.remove();

      mapRef.current = null;
    };

  }, []);

  /**
   * ==========================
   * INTERAKSI BIDANG
   * ==========================
   */
  function pasangInteraksi(map: MLMap) {
    let hov: number | null = null;

    /**
     * Hover bidang
     */
    map.on(
      'mousemove',
      'bidang',
      (e) => {

        map.getCanvas().style.cursor =
          'pointer';

        const id =
          e.features?.[0]?.id as number;

        if (hov !== null) {
          map.setFeatureState(
            {
              source: 'bidang',
              id: hov
            },
            {
              hov: false
            }
          );
        }

        hov = id;

        map.setFeatureState(
          {
            source: 'bidang',
            id
          },
          {
            hov: true
          }
        );
      }
    );

    /**
     * Mouse leave
     */
    map.on(
      'mouseleave',
      'bidang',
      () => {

        map.getCanvas().style.cursor =
          '';

        if (hov !== null) {
          map.setFeatureState(
            {
              source: 'bidang',
              id: hov
            },
            {
              hov: false
            }
          );
        }

        hov = null;
      }
    );

    /**
     * ==========================
     * POPUP
     * ==========================
     */
    map.on(
      'click',
      'bidang',
      (e) => {

        const f =
          e.features?.[0];

        if (!f) return;

        const p =
          f.properties as any;

        popupRef.current?.remove();

        const el =
          document.createElement(
            'div'
          );

        el.className = 'pop';

        el.innerHTML = `
          <div class="ph">
            <div class="id">
              ${p.kode}
            </div>

            <div class="nm">
              ${p.pemilik ?? '—'}
            </div>
          </div>

          <div class="pb">

            <div>
              <span>
                Luas bidang
              </span>

              <b>
                ${fmt(p.luas)} m²
              </b>
            </div>

            <div>
              <span>
                Terdampak ROW
              </span>

              <b>
                ${fmt(p.kena)} m²
              </b>
            </div>

            <div>
              <span>
                Penggunaan
              </span>

              <b
                style="font-family:var(--f-body)"
              >
                ${p.penggunaan ?? '—'}
              </b>
            </div>

            <div>
              <span>
                Status
              </span>

              <b
                style="
                  font-family:var(--f-body);
                  color:${STATUS_WARNA[
                    p.status as StatusBidang
                  ]}
                "
              >
                ${
                  STATUS_LABEL[
                    p.status as StatusBidang
                  ]
                }
              </b>
            </div>

          </div>

          <button>
            Buka kartu bidang
          </button>
        `;

        el
          .querySelector('button')!
          .addEventListener(
            'click',
            () => {

              pilihBidang(
                p.id
              );

              sorot(
                map,
                f.id as number
              );

              popupRef.current?.remove();
            }
          );

        popupRef.current =
          new maplibregl.Popup({
            closeButton: true,
            offset: 12,
            maxWidth: 'none'
          })
            .setLngLat(e.lngLat)
            .setDOMContent(el)
            .addTo(map);
      }
    );
  }

  /**
   * ==========================
   * SOROT BIDANG
   * ==========================
   */
  function sorot(
    map: MLMap,
    fid: number
  ) {

    if (
      terpilihRef.current !== null
    ) {
      map.setFeatureState(
        {
          source: 'bidang',
          id:
            terpilihRef.current
        },
        {
          sel: false
        }
      );
    }

    terpilihRef.current =
      fid;

    map.setFeatureState(
      {
        source: 'bidang',
        id: fid
      },
      {
        sel: true
      }
    );
  }

  /**
   * ==========================
   * ZOOM KE TRACE
   * ==========================
   */
  const zoomKeTrace = (
    map: MLMap
  ) => {

    fetch(
      '/api/layers/trace'
    )
      .then((r) => r.json())
      .then((fc) => {

        if (
          !fc.features?.length
        ) {
          return;
        }

        const b =
          new maplibregl.LngLatBounds();

        for (
          const f
          of fc.features
        ) {
          for (
            const c
            of f.geometry.coordinates
          ) {
            b.extend(c as any);
          }
        }

        if (!b.isEmpty()) {
          map.fitBounds(
            b,
            {
              padding: 70,
              duration: 900
            }
          );
        }
      })
      .catch(() => {});
  };

  /**
   * ==========================
   * BASEMAP
   * ==========================
   */
  useEffect(() => {

    const map =
      mapRef.current;

    if (
      !map?.isStyleLoaded()
    ) {
      return;
    }

    /**
     * Orthophoto
     */
    if (
      map.getLayer(
        'bm-ortho'
      )
    ) {
      map.setLayoutProperty(
        'bm-ortho',
        'visibility',
        basemap === 'ortho'
          ? 'visible'
          : 'none'
      );
    }

    /**
     * OSM
     */
    map.setLayoutProperty(
      'bm-osm',
      'visibility',

      basemap === 'osm' ||
      (
        basemap === 'ortho' &&
        !ADA_ORTHO
      )
        ? 'visible'
        : 'none'
    );

    /**
     * Kalau ortho belum tersedia,
     * fallback ke OSM.
     */
    if (
      basemap === 'ortho' &&
      !ADA_ORTHO
    ) {
      beriPesan(
        'Orthophoto belum tersedia — isi NEXT_PUBLIC_TILES_ORTHO di .env setelah tiling selesai.'
      );
    }

  }, [basemap]);

  /**
   * ==========================
   * DTM
   * ==========================
   */
  useEffect(() => {

    const map =
      mapRef.current;

    if (
      !map?.isStyleLoaded()
    ) {
      return;
    }

    /**
     * DTM OFF
     */
    if (dtm === 'off') {

      map.setTerrain(null);

      if (
        map.getLayer(
          'hillshade'
        )
      ) {
        map.removeLayer(
          'hillshade'
        );
      }

      for (
        const d
        of [
          KONTUR.lidar,
          KONTUR.foto
        ]
      ) {
        if (
          map.getLayer(
            d.id
          )
        ) {
          map.setLayoutProperty(
            d.id,
            'visibility',
            'none'
          );
        }
      }

      map.easeTo({
        pitch: 0,
        duration: 850
      });

      return;
    }

    /**
     * DTM belum tersedia
     */
    if (!ADA_DTM[dtm]) {

      beriPesan(
        `DTM ${
          dtm === 'lidar'
            ? 'LiDAR'
            : 'foto udara'
        } belum tersedia — isi NEXT_PUBLIC_TILES_DTM_* di .env setelah tiling selesai.`
      );

      return;
    }

    const src =
      dtm === 'lidar'
        ? 'dem_lidar'
        : 'dem_foto';

    /**
     * Hillshade
     */
    if (
      map.getLayer(
        'hillshade'
      )
    ) {
      map.removeLayer(
        'hillshade'
      );
    }

    map.addLayer({
      id: 'hillshade',

      type: 'hillshade',

      source: src,

      paint: {
        'hillshade-exaggeration':
          0.45
      }
    }, LAYERS[0].id);

    /**
     * Terrain
     */
    map.setTerrain({
      source: src,
      exaggeration: exag
    });

    /**
     * Kontur mengikuti DTM
     */
    for (
      const [k, def]
      of [
        ['lidar', KONTUR.lidar],
        ['foto', KONTUR.foto]
      ] as const
    ) {

      if (
        map.getLayer(
          def.id
        )
      ) {
        map.setLayoutProperty(
          def.id,
          'visibility',
          dtm === k
            ? 'visible'
            : 'none'
        );
      }
    }

    map.easeTo({
      pitch: 52,
      duration: 850
    });

  }, [dtm, exag]);

  /**
   * ==========================
   * PEWARNAAN BIDANG
   * ==========================
   */
  useEffect(() => {

    const map =
      mapRef.current;

    if (
      !map?.isStyleLoaded()
    ) {
      return;
    }

    map.setPaintProperty(
      'bidang',
      'fill-color',

      pewarnaan === 'status'
        ? ekspresiStatus()
        : ekspresiPenggunaan()
    );

  }, [pewarnaan]);

  /**
   * ==========================
   * LABEL NOMOR
   * ==========================
   */
  useEffect(() => {

    const map =
      mapRef.current;

    if (
      !map?.isStyleLoaded()
    ) {
      return;
    }

    map.setLayoutProperty(
      'bidang-lb',
      'visibility',

      labelNomor
        ? 'visible'
        : 'none'
    );

  }, [labelNomor]);

  /**
   * ==========================
   * LAYER AKTIF
   * ==========================
   */
  useEffect(() => {

    const map =
      mapRef.current;

    if (
      !map?.isStyleLoaded()
    ) {
      return;
    }

    for (
      const L
      of LAYERS
    ) {

      const v =
        layerAktif[L.id]
          ? 'visible'
          : 'none';

      if (
        map.getLayer(
          L.id
        )
      ) {
        map.setLayoutProperty(
          L.id,
          'visibility',
          v
        );
      }

      if (
        map.getLayer(
          L.id + '-ln'
        )
      ) {
        map.setLayoutProperty(
          L.id + '-ln',
          'visibility',
          v
        );
      }
    }

  }, [layerAktif]);

  /**
   * ==========================
   * EVENT ZOOM TRACE
   * ==========================
   */
  useEffect(() => {

    const zoomTrace = () => {
      // Fungsi zoom ke trace
    };

    window.addEventListener(
      'zoom-trace',
      zoomTrace
    );

    return () => {
      window.removeEventListener(
        'zoom-trace',
        zoomTrace
      );
    };

  }, []);

  /**
   * ==========================
   * TEMA
   * ==========================
   */
  useEffect(() => {

    const m =
      mapRef.current;

    if (
      m?.isStyleLoaded()
    ) {
      warnaiTema(m);
    }

  }, [tema]);

  return (
    <div
      ref={ref}
      className="canvas"
    />
  );
}

/**
 * ==========================
 * FORMAT ANGKA
 * ==========================
 */
const fmt = (
  n: number | null
) =>
  (n ?? 0).toLocaleString(
    'id-ID'
  );

/**
 * ==========================
 * WARNA STATUS
 * ==========================
 */
const ekspresiStatus =
  (): any => [
    'match',
    ['get', 'status'],

    'draft',
    STATUS_WARNA.draft,

    'terkirim',
    STATUS_WARNA.terkirim,

    'terverifikasi',
    STATUS_WARNA.terverifikasi,

    'revisi',
    STATUS_WARNA.revisi,

    '#888'
  ];

/**
 * ==========================
 * WARNA PENGGUNAAN
 * ==========================
 */
const ekspresiPenggunaan =
  (): any => {

    const m: any[] = [
      'match',
      ['get', 'penggunaan']
    ];

    for (
      const [k, v]
      of Object.entries(
        WARNA_PENGGUNAAN
      )
    ) {
      m.push(k, v);
    }

    m.push('#888');

    return m;
  };

/**
 * ==========================
 * TEMA PETA
 * ==========================
 *
 * Warna peta ikut tema terang/gelap,
 * bukan hanya panel.
 */
function warnaiTema(
  map: MLMap
) {

  const gelap =
    document.documentElement
      .dataset.theme === 'dark';

  map.setPaintProperty(
    'bg',
    'background-color',
    gelap
      ? '#0E1720'
      : '#E7EBF3'
  );

  map.setPaintProperty(
    'bm-osm',
    'raster-brightness-max',
    gelap
      ? 0.84
      : 1
  );

  if (
    map.getLayer(
      'bidang-ln'
    )
  ) {

    map.setPaintProperty(
      'bidang-ln',
      'line-color',

      [
        'case',

        [
          'boolean',
          ['feature-state', 'sel'],
          false
        ],

        gelap
          ? '#FFFFFF'
          : '#1E2733',

        gelap
          ? 'rgba(14,23,32,.85)'
          : 'rgba(30,39,51,.5)'
      ]
    );
  }

  if (
    map.getLayer(
      'bidang-lb'
    )
  ) {

    map.setPaintProperty(
      'bidang-lb',
      'text-color',

      gelap
        ? '#0E1720'
        : '#1E2733'
    );

    map.setPaintProperty(
      'bidang-lb',
      'text-halo-color',
      'rgba(255,255,255,.9)'
    );
  }

  if (
    map.getLayer(
      'hillshade'
    )
  ) {

    map.setPaintProperty(
      'hillshade',
      'hillshade-shadow-color',

      gelap
        ? '#0B1219'
        : '#4A5A78'
    );
  }
}