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

const siap = (url?: string) =>
  !!url &&
  !url.includes('contoh.id') &&
  (url.startsWith('http') || url.startsWith('/'));

const ADA_ORTHO = siap(ORTHO);

const ADA_KONTUR = {
  lidar: siap(KONTUR.lidar.url),
  foto: siap(KONTUR.foto.url)
};
const TRACE_G_URL =
  'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/traseg.geojson';
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
      'maplibregl-ctrl basemap-control';

    const button =
      document.createElement('button');

    button.type = 'button';
    button.title = 'Basemap';
    button.setAttribute(
      'aria-label',
      'Basemap'
    );

    button.innerHTML = '🗺️';

    const panel =
      document.createElement('div');

    panel.className =
      'basemap-panel';

    panel.style.display = 'none';

    const pilihan: {
      id: Basemap;
      label: string;
      icon: string;
    }[] = [
      {
        id: 'osm',
        label: 'OSM',
        icon: '🌍'
      },
      {
        id: 'esri',
        label: 'Esri',
        icon: '🛰️'
      },
      {
        id: 'ortho',
        label: 'Orthophoto',
        icon: '📷'
      },
      {
        id: 'google-hybrid',
        label: 'Google Hybrid',
        icon: '🗺️'
      },
      {
        id: 'google-streets',
        label: 'Google Streets',
        icon: '🚗'
      },
      {
        id: 'opentopo',
        label: 'OpenTopo',
        icon: '⛰️'
      }
    ];

    for (const p of pilihan) {
      const item =
        document.createElement('button');

      item.type = 'button';

      item.className =
        'basemap-item';

      item.dataset.basemap = p.id;

      item.innerHTML = `
        <span class="basemap-item-icon">
          ${p.icon}
        </span>

        <span class="basemap-item-label">
          ${p.label}
        </span>
      `;

      if (p.id === this.current) {
        item.classList.add(
          'active'
        );
      }

      item.onclick = (e) => {
        e.stopPropagation();

        this.current = p.id;

        for (
          const child
          of panel.querySelectorAll(
            '.basemap-item'
          )
        ) {
          child.classList.remove(
            'active'
          );
        }

        item.classList.add(
          'active'
        );

        panel.style.display =
          'none';

        this.onChange(p.id);
      };

      panel.appendChild(item);
    }

    button.onclick = (e) => {
      e.stopPropagation();

      panel.style.display =
        panel.style.display === 'none'
          ? 'grid'
          : 'none';
    };

    this.container.appendChild(
      button
    );

    this.container.appendChild(
      panel
    );

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

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    if (!protokolTerpasang) {
      maplibregl.addProtocol('pmtiles', pmtiles.tile);
      protokolTerpasang = true;
    }

    const sources: any = {
  osm: {
    type: 'raster',
    tiles: [
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: '© OpenStreetMap'
  },

  esri: {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: '© Esri'
  },

  'google-hybrid': {
    type: 'raster',
    tiles: [
      'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
    ],
    tileSize: 256,
    maxzoom: 20,
    attribution: '© Google'
  },

  'google-streets': {
    type: 'raster',
    tiles: [
      'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
    ],
    tileSize: 256,
    maxzoom: 20,
    attribution: '© Google'
  },

  opentopo: {
    type: 'raster',
    tiles: [
      'https://a.tile.opentopomap.org/{z}/{x}/{y}.png'
    ],
    tileSize: 256,
    maxzoom: 17,
    attribution:
      '© OpenTopoMap (CC-BY-SA)'
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

if (DTM.aws) {
  sources.dem_aws = {
    type: 'raster-dem',
    tiles: [DTM.aws],
    tileSize: 256,
    encoding: 'terrarium',
  };
}

if (DTM.r2) {
  sources.dem_r2 = {
    type: 'raster-dem',
    tiles: [DTM.r2],
    tileSize: 256,
    encoding: 'terrarium',
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
      visibility:
        basemap === 'osm'
          ? 'visible'
          : 'none'
    },
    paint: {
      'raster-saturation': -0.5
    }
  },

  {
    id: 'bm-esri',
    type: 'raster',
    source: 'esri',
    layout: {
      visibility:
        basemap === 'esri'
          ? 'visible'
          : 'none'
    }
  },

  {
    id: 'bm-google-hybrid',
    type: 'raster',
    source: 'google-hybrid',
    layout: {
      visibility:
        basemap === 'google-hybrid'
          ? 'visible'
          : 'none'
    }
  },

  {
    id: 'bm-google-streets',
    type: 'raster',
    source: 'google-streets',
    layout: {
      visibility:
        basemap === 'google-streets'
          ? 'visible'
          : 'none'
    }
  },

  {
    id: 'bm-opentopo',
    type: 'raster',
    source: 'opentopo',
    layout: {
      visibility:
        basemap === 'opentopo'
          ? 'visible'
          : 'none'
    }
  }
];

   if (ADA_ORTHO) {
  layersAwal.push({
    id: 'bm-ortho',
    type: 'raster',
    source: 'ortho',
    layout: {
      visibility:
        basemap === 'ortho'
          ? 'visible'
          : 'none'
    }
  });
}
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

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true
      }),
      'top-right'
    );

    const basemapControl = new BasemapControl(
      basemap,
      (value) => setBasemap(value)
    );

    map.addControl(
      basemapControl,
      'top-right'
    );

    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 110,
        unit: 'metric'
      }),
      'bottom-right'
    );


    map.on('load', () => {

   
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

  
     for (const L of LAYERS) {

  if (L.id === 'bidang') continue;

map.addSource(L.id, {
  type: 'geojson',
  data:
    L.id === 'trace_g'
      ? 'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/traseg.geojson'
      : `/api/layers/${L.sumber}`
});

  const vis =
    L.bawaan
      ? 'visible'
      : 'none';
 
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

              'line-opacity':
                L.opasitas ?? 1,

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

      if (
        map.getSource('trace_g') &&
        map.getLayer('trace_g')
      ) {

        map.addLayer(
          {
            id: 'trace_g_halo',

            type: 'line',

            source: 'trace_g',

            layout: {
              visibility:
                layerAktif.trace_g
                  ? 'visible'
                  : 'none'
            },

            paint: {
              'line-color': '#FFFFFF',

              'line-width': [
                '+',
                [
                  'coalesce',
                  [
                    'to-number',
                    LAYERS.find(
                      (l) => l.id === 'trace_g'
                    )?.lebar ?? 4
                  ],
                  4
                ],
                4
              ],

              'line-opacity': 0.95
            }
          },
          'trace_g'
        );

      
        map.moveLayer('trace_g');

        map.moveLayer(
          'trace_g_halo',
          'trace_g'
        );

        map.moveLayer('trace_g');
      }


      map.addSource('bidang', {
  type: 'geojson',
  data: '/api/bidang'
});

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
       * =====================================================
       * TRACE G DIJAGA PALING ATAS
       * =====================================================
       *
       * Karena bidang ditambahkan setelah Trace G,
       * kita pindahkan kembali Trace G ke atas.
       */
      if (
        map.getLayer('trace_g_halo') &&
        map.getLayer('trace_g')
      ) {
        map.moveLayer(
          'trace_g_halo'
        );

        map.moveLayer(
          'trace_g'
        );
      }

      /**
       * Tema
       */
      warnaiTema(map);

      /**
       * Interaksi bidang
       */
      pasangInteraksi(map);

      /**
       * Zoom ke Trace G
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
     * POPUP BIDANG
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

  const zoomKeTrace = (
  map: MLMap
) => {

  fetch(TRACE_G_URL)
    .then((r) => {
      if (!r.ok) {
        throw new Error(
          `Trace G HTTP ${r.status}`
        );
      }

      return r.json();
    })
    .then((fc) => {

      if (!fc.features?.length) {
        return;
      }

      const b =
        new maplibregl.LngLatBounds();

      const tambahKoordinat = (
        coords: any
      ) => {

        if (!Array.isArray(coords)) {
          return;
        }

        if (
          coords.length >= 2 &&
          typeof coords[0] === 'number' &&
          typeof coords[1] === 'number'
        ) {
          b.extend(
            coords as [number, number]
          );

          return;
        }

        for (const c of coords) {
          tambahKoordinat(c);
        }
      };

      for (const f of fc.features) {
        if (f.geometry?.coordinates) {
          tambahKoordinat(
            f.geometry.coordinates
          );
        }
      }

      if (!b.isEmpty()) {
        map.fitBounds(b, {
          padding: 70,
          duration: 900,
          maxZoom: 14.5
        });
      }
    })
    .catch((err) => {
      console.warn(
        'Gagal zoom Trace G:',
        err
      );
    });
};
useEffect(() => {
  const map = mapRef.current;

  if (!map?.isStyleLoaded()) {
    return;
  }

  const basemapLayers: {
    id: string;
    basemap: Basemap;
  }[] = [
    {
      id: 'bm-osm',
      basemap: 'osm'
    },
    {
      id: 'bm-esri',
      basemap: 'esri'
    },
    {
      id: 'bm-google-hybrid',
      basemap: 'google-hybrid'
    },
    {
      id: 'bm-google-streets',
      basemap: 'google-streets'
    },
    {
      id: 'bm-opentopo',
      basemap: 'opentopo'
    },
    {
      id: 'bm-ortho',
      basemap: 'ortho'
    }
  ];

  for (const item of basemapLayers) {
    if (!map.getLayer(item.id)) {
      continue;
    }

    map.setLayoutProperty(
      item.id,
      'visibility',
      item.basemap === basemap
        ? 'visible'
        : 'none'
    );
  }

  /**
   * Orthophoto belum tersedia.
   */
  if (
    basemap === 'ortho' &&
    !ADA_ORTHO
  ) {
    /**
     * Fallback ke OSM.
     */
    if (
      map.getLayer('bm-osm')
    ) {
      map.setLayoutProperty(
        'bm-osm',
        'visibility',
        'visible'
      );
    }

    beriPesan(
      'Orthophoto belum tersedia — isi NEXT_PUBLIC_TILES_ORTHO di .env setelah tiling selesai.'
    );
  }

}, [basemap, beriPesan]);
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
 * ==========================
 * DTM BELUM TERSEDIA
 * ==========================
 */
const urlDTM =
  dtm === 'aws'
    ? DTM.aws
    : DTM.r2;

if (!urlDTM) {
  beriPesan(
    `DTM ${
      dtm === 'aws'
        ? 'AWS Terrarium 30 m'
        : 'DTM 3 m'
    } belum tersedia — isi ${
      dtm === 'aws'
        ? 'NEXT_PUBLIC_TILES_DTM_AWS'
        : 'NEXT_PUBLIC_TILES_DTM_R2'
    } di .env.`
  );

  return;
}

const src =
  dtm === 'aws'
    ? 'dem_aws'
    : 'dem_r2';
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
    });

    /**
     * Terrain
     */
    map.setTerrain({
      source: src,
      exaggeration: exag
    });

for (const def of [
  KONTUR.lidar,
  KONTUR.foto
]) {
  if (map.getLayer(def.id)) {
    map.setLayoutProperty(
      def.id,
      'visibility',
      'none'
    );
  }
}

    map.easeTo({
      pitch: 52,
      duration: 850
    });

    /**
     * Trace G harus tetap paling atas
     * setelah hillshade dibuat.
     */
    if (
      map.getLayer('trace_g_halo') &&
      map.getLayer('trace_g')
    ) {
      map.moveLayer(
        'trace_g_halo'
      );

      map.moveLayer(
        'trace_g'
      );
    }

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

    /**
     * Trace G mempunyai halo sendiri.
     * Halo harus mengikuti checkbox Trace G.
     */
    if (
      map.getLayer('trace_g_halo')
    ) {
      map.setLayoutProperty(
        'trace_g_halo',
        'visibility',
        layerAktif.trace_g
          ? 'visible'
          : 'none'
      );
    }

    /**
     * Pastikan Trace G tetap paling atas.
     */
    if (
      layerAktif.trace_g &&
      map.getLayer('trace_g')
    ) {
      if (
        map.getLayer('trace_g_halo')
      ) {
        map.moveLayer(
          'trace_g_halo'
        );
      }

      map.moveLayer(
        'trace_g'
      );
    }

  }, [layerAktif]);

  /**
   * ==========================
   * EVENT ZOOM TRACE
   * ==========================
   */
  useEffect(() => {

    const zoomTrace = () => {

      const map =
        mapRef.current;

      if (!map) return;

      zoomKeTrace(map);
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
