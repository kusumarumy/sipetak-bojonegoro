'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MLMap, Popup } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { useApp, type Basemap } from '@/store/useApp';
import {
  LAYERS,
  KONTUR,
  DTM,
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

const ADA_KONTUR = {
  lidar: siap(KONTUR.lidar.url),
  foto: siap(KONTUR.foto.url)
};
const TRASEG_URL =
  'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/wgs84/traseg.geojson';

export default function MapCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const [infoPeta, setInfoPeta] = useState({
    lon: 0,
    lat: 0,
    zoom: 0,
    pitch: 0,
    bearing: 0
  });
const terpilihRef =
  useRef<string | number | null>(null);
const analisisRef =
  useRef<(string | number)[]>([]);
  useEffect(() => {
  const handleAnalisisBidang = (
    event: Event
  ) => {
    const customEvent =
      event as CustomEvent<{
        ids?: (string | number)[];
      }>;

    const ids =
      customEvent.detail?.ids ?? [];

    // Hapus highlight analisis sebelumnya
    for (const id of analisisRef.current) {
      mapRef.current?.setFeatureState(
        {
          source: 'bidang',
          id,
        },
        {
          analisis: false,
        }
      );
    }

    analisisRef.current = [];

    if (!mapRef.current || ids.length === 0) {
      return;
    }

    // Highlight bidang hasil analisis
    for (const id of ids) {
      mapRef.current.setFeatureState(
        {
          source: 'bidang',
          id,
        },
        {
          analisis: true,
        }
      );
    }

    analisisRef.current = ids;
  };

  window.addEventListener(
    'analisis-bidang',
    handleAnalisisBidang
  );

  return () => {
    window.removeEventListener(
      'analisis-bidang',
      handleAnalisisBidang
    );
  };
}, []);
const {
  basemap,
  setBasemap,
  dtm,
  exag,
  pewarnaan,
  labelNomor,
  modeAnalisis,
  layerAktif,
  tema,
  filterBidang,
  pilihBidang,
  beriPesan
} = useApp();
useEffect(() => {
  const handleFokusBidang = (
    event: Event
  ) => {
    const customEvent =
      event as CustomEvent<{
        id?: string | number;
      }>;

    const id =
      customEvent.detail?.id;

    const map =
      mapRef.current;

    if (
      id === undefined ||
      !map
    ) {
      return;
    }

    const fokus = () => {
      if (!map.isStyleLoaded()) {
        return;
      }

      if (!map.getSource('bidang')) {
        return;
      }

      const features =
        map.querySourceFeatures('bidang');

      const feature =
        features.find(
          (f) =>
            String(f.id) ===
            String(id)
        );

      if (!feature) {
        console.warn(
          'Bidang tidak ditemukan di source:',
          id
        );

        return;
      }

      // Highlight bidang
      if (
        feature.id !== undefined
      ) {
        sorot(
          map,
          feature.id
        );
      }

      // Hitung bounds geometry bidang
      const bounds =
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
          bounds.extend(
            coords as [number, number]
          );

          return;
        }

        for (const c of coords) {
          tambahKoordinat(c);
        }
      };

      const geometry = feature.geometry as any;

if (geometry?.coordinates) {
  tambahKoordinat(
    geometry.coordinates
  );
}

      if (bounds.isEmpty()) {
        return;
      }

      map.fitBounds(bounds, {
        padding: {
          top: 170,
          bottom: 120,
          left: 470,
          right: 430
        },
        duration: 900,
        maxZoom: 18
      });
    };

    /*
     * Kalau source sudah siap,
     * langsung fokus.
     */
    if (map.isStyleLoaded()) {
      fokus();
    } else {
      map.once('load', fokus);
    }
  };

  window.addEventListener(
    'fokus-bidang',
    handleFokusBidang
  );

  return () => {
    window.removeEventListener(
      'fokus-bidang',
      handleFokusBidang
    );
  };
}, []);
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

sources.ortho = {
  type: 'raster',
  tiles: [
    'https://dppt-bojonegoro.ruli-andaru.workers.dev/orthophoto/{z}/{x}/{y}.png',
  ],
  tileSize: 256,
  minzoom: 10,
  maxzoom: 21,
  attribution: 'Orthophoto DPPT Bojonegoro 2026',
};

if (DTM.trace) {
  sources.dtm_trace = {
    type: 'raster-dem',
    tiles: [DTM.trace],
    tileSize: 256,
    encoding: 'terrarium',
    minzoom: 10,
    maxzoom: 18,
  };
}

if (DTM.kawasan) {
  sources.dtm_kawasan = {
    type: 'raster-dem',
    tiles: [DTM.kawasan],
    tileSize: 256,
    encoding: 'terrarium',
    minzoom: 10,
    maxzoom: 18,
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
      basemap === 'esri' ||
      basemap === 'ortho'
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
    const map = new maplibregl.Map({
      container: ref.current,

      center: [111.879, -7.168],
      zoom: 12.4,
      bearing: 18,
      maxPitch: 75,

      attributionControl: false,

      style: {
        version: 8,

        glyphs:
          'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',

        sources,
        layers: layersAwal
      }
    });

mapRef.current = map;
const perbaruiInfoPeta = () => {
  const center = map.getCenter();

  setInfoPeta({
    lon: center.lng,
    lat: center.lat,
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing()
  });
};

map.on('move', perbaruiInfoPeta);
map.on('zoom', perbaruiInfoPeta);
map.on('rotate', perbaruiInfoPeta);
map.on('pitch', perbaruiInfoPeta);

perbaruiInfoPeta();
const resizeObserver = new ResizeObserver(() => {
  map.resize();
});

resizeObserver.observe(ref.current);
    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true
      }),
      'top-right'
    );
    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 110,
        unit: 'metric'
      }),
      'bottom-left'
    );
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true
      }),
      'bottom-left'
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
    L.id === 'traseg'
      ? 'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/wgs84/traseg.geojson'
      : `/api/layers/${L.sumber}`
});

const vis =
  layerAktif[L.id]
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
        map.getSource('traseg') &&
        map.getLayer('traseg')
      ) {

        map.addLayer(
          {
            id: 'traseg_halo',

            type: 'line',

            source: 'traseg',

            layout: {
              visibility:
                layerAktif.traseg
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
                      (l) => l.id === 'traseg'
                    )?.lebar ?? 4
                  ],
                  4
                ],
                4
              ],

              'line-opacity': 0.95
            }
          },
          'traseg'
        );
      }
     map.addSource('bidang', {
  type: 'geojson',
  data: '/api/bidang',
  promoteId: 'id',
});

map.addLayer({
  id: 'bidang',

  type: 'fill',

  source: 'bidang',

  paint: {
'fill-color': [
  'case',

  // hasil analisis
  [
    'boolean',
    ['feature-state', 'analisis'],
    false
  ],
  '#00E5FF',

  // bidang yang sedang dipilih
  [
    'boolean',
    ['feature-state', 'sel'],
    false
  ],
  '#A51F35',

  // warna normal
  pewarnaan === 'status'
    ? ekspresiStatus()
    : ekspresiPenggunaan()
],
    'fill-opacity': [
  'case',

  // hasil analisis
  [
    'boolean',
    ['feature-state', 'analisis'],
    false
  ],
  0.88,

  // bidang hasil filter
  [
    'boolean',
    ['feature-state', 'filter'],
    false
  ],
  0.92,

  // bidang yang sedang dipilih
  [
    'boolean',
    ['feature-state', 'sel'],
    false
  ],
  0.95,

  // hover
  [
    'boolean',
    ['feature-state', 'hov'],
    false
  ],
  0.74,

  // normal
  0.35
]
  }
});

 if (
  map.getLayer('traseg_halo') &&
  map.getLayer('traseg') &&
  map.getLayer('bidang')
) {
  map.moveLayer('traseg_halo', 'bidang');
  map.moveLayer('traseg', 'bidang');
}
map.addLayer({
  id: 'bidang-ln',

  type: 'line',

  source: 'bidang',

  paint: {
'line-color': [
  'case',

  // hasil analisis
  [
    'boolean',
    ['feature-state', 'analisis'],
    false
  ],
  '#00E5FF',

  [
    'boolean',
    ['feature-state', 'filter'],
    false
  ],
  '#FFFFFF',

  [
    'boolean',
    ['feature-state', 'sel'],
    false
  ],
  '#FFFFFF',

  'rgba(14,23,32,.45)'
],

    'line-width': [
  'case',

  // hasil analisis
  [
    'boolean',
    ['feature-state', 'analisis'],
    false
  ],
  2.5,

  [
    'boolean',
    ['feature-state', 'filter'],
    false
  ],
  2.2,

  [
    'boolean',
    ['feature-state', 'sel'],
    false
  ],
  3,

  0.6
],

    'line-opacity': [
      'case',

      [
        'boolean',
        ['feature-state', 'filter'],
        false
      ],
      1,

      0.65
    ]
  }
});
map.addLayer({
  id: 'bidang-filter',
  type: 'fill',
  source: 'bidang',

  filter: ['==', ['get', '__filter_never_match__'], '__never__'],

  paint: {
    'fill-color': '#FF1744',
    'fill-opacity': 0.30
  }
});

map.addLayer({
  id: 'bidang-filter-ln',
  type: 'line',
  source: 'bidang',

  filter: ['==', ['get', '__filter_never_match__'], '__never__'],

  paint: {
    'line-color': '#FF1744',
    'line-width': 3,
    'line-opacity': 1
  }
});
      map.addLayer({
        id: 'bidang-lb',
        type: 'symbol',
        source: 'bidang',
        minzoom: 15.5,
        layout: {
          'visibility': labelNomor ? 'visible' : 'none',
          'text-field': [
            'get',
            'nib'
          ],
          'text-size': 12,
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color':
            'rgba(255,255,255,.85)',
          'text-halo-width': 1.1
        }
      });
      
      warnaiTema(map);
      pasangInteraksi(map);
      zoomKeTrase(map);
    });

    map.on('error', (e) => {
      console.warn(
        'MapLibre:',
        e.error?.message ?? e
      );
    });

return () => {
  resizeObserver.disconnect();

  popupRef.current?.remove();

  for (const id of analisisRef.current) {
    map.setFeatureState(
      {
        source: 'bidang',
        id,
      },
      {
        analisis: false,
      }
    );
  }

  analisisRef.current = [];

  map.remove();

  mapRef.current = null;
};

  }, []);

  function pasangInteraksi(map: MLMap) {
    let hov: string | number | null = null;

    map.on(
      'mousemove',
      'bidang',
      (e) => {
        map.getCanvas().style.cursor =
          'pointer';
const id =
  e.features?.[0]?.id;

if (id === undefined) {
  return;
}
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
              ${p.kode_bid}
            </div>

            <div class="nm">
              ${p.nama_milik ?? '—'}
            </div>
          </div>

          <div class="pb">

            <div>
              <span>
                Luas bidang
              </span>

              <b>
                ${fmt(p.luas_tnh)} m²
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

if (f.id !== undefined) {
  sorot(
    map,
    f.id
  );
}

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

function sorot(
  map: MLMap,
  fid: string | number
) {
  if (
    terpilihRef.current !== null
  ) {
    map.setFeatureState(
      {
        source: 'bidang',
        id: terpilihRef.current
      },
      {
        sel: false
      }
    );
  }

  terpilihRef.current = fid;

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

  const zoomKeTrase = (
  map: MLMap
) => {

  fetch(TRASEG_URL)
    .then((r) => {
      if (!r.ok) {
        throw new Error(
          `Trase G HTTP ${r.status}`
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
  const geometry = f.geometry as any;

  if (geometry?.coordinates) {
    tambahKoordinat(
      geometry.coordinates
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
        'Gagal zoom Trase G:',
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

  const visible =
    item.id === 'bm-esri'
      ? basemap === 'esri' || basemap === 'ortho'
      : item.basemap === basemap;

  map.setLayoutProperty(
    item.id,
    'visibility',
    visible ? 'visible' : 'none'
  );
}

}, [basemap, beriPesan]);
useEffect(() => {
  const map = mapRef.current;

  if (!map) return;

  const terapkanDTM = () => {
    if (!map.isStyleLoaded()) return;

    // =========================
    // DTM OFF
    // =========================
    if (dtm === 'off') {
      map.setTerrain(null);

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
        pitch: 0,
        duration: 850
      });

      return;
    }

    // =========================
    // PILIH DTM
    // =========================
    const src =
      dtm === 'trace'
        ? 'dtm_trace'
        : 'dtm_kawasan';

    const urlDTM =
      dtm === 'trace'
        ? DTM.trace
        : DTM.kawasan;

    if (!urlDTM) {
      map.setTerrain(null);

      beriPesan(
        `DTM ${
          dtm === 'trace'
            ? 'Rencana Trace'
            : 'Kawasan'
        } belum tersedia.`
      );

      return;
    }

    // =========================
    // PASTIKAN SOURCE ADA
    // =========================
    if (!map.getSource(src)) {
      console.warn(
        'Source DTM tidak ditemukan:',
        src
      );

      beriPesan(
        `Source ${
          dtm === 'trace'
            ? 'DTM Rencana Trace'
            : 'DTM Kawasan'
        } belum tersedia.`
      );

      return;
    }

    // =========================
    // TERRAIN 3D
    // =========================
    map.setTerrain({
      source: src,
      exaggeration: exag
    });

    // Kontur tidak diperlukan ketika
    // terrain sedang aktif
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

    // Kamera dibuat miring agar relief terlihat
    map.easeTo({
      pitch: 52,
      duration: 850
    });
  };

  if (map.isStyleLoaded()) {
    terapkanDTM();
  } else {
    map.once(
      'load',
      terapkanDTM
    );
  }

  return () => {
    map.off(
      'load',
      terapkanDTM
    );
  };
}, [dtm, exag]);

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
  [
    'case',

    // hasil analisis
    [
      'boolean',
      ['feature-state', 'analisis'],
      false
    ],
    '#00E5FF',

    // warna normal
    pewarnaan === 'status'
      ? ekspresiStatus()
      : ekspresiPenggunaan()
  ]
);

  }, [pewarnaan]);

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

if (map.getLayer('traseg')) {
  map.setLayoutProperty(
    'traseg',
    'visibility',
    layerAktif.traseg
      ? 'visible'
      : 'none'
  );
}

if (map.getLayer('traseg_halo')) {
  map.setLayoutProperty(
    'traseg_halo',
    'visibility',
    layerAktif.traseg
      ? 'visible'
      : 'none'
  );
}

if (
  map.getLayer('traseg_halo') &&
  map.getLayer('traseg') &&
  map.getLayer('bidang')
) {
  map.moveLayer('traseg_halo', 'bidang');
  map.moveLayer('traseg', 'bidang');
}

  }, [layerAktif]);
useEffect(() => {
  const map = mapRef.current;

  if (!map) return;

  const terapkanFilter = () => {
    if (
      !map.getLayer('bidang-filter') ||
      !map.getLayer('bidang-filter-ln')
    ) {
      return;
    }

    const expression =
      ekspresiFilterBidang(filterBidang);

    map.setFilter(
      'bidang-filter',
      expression
    );

    map.setFilter(
      'bidang-filter-ln',
      expression
    );
  };

  /*
   * Map sudah siap
   */
  if (map.isStyleLoaded()) {
    terapkanFilter();
  } else {
    map.once(
      'load',
      terapkanFilter
    );
  }

  return () => {
    map.off(
      'load',
      terapkanFilter
    );
  };

}, [filterBidang]);
  useEffect(() => {

    const zoomTrase = () => {

      const map =
        mapRef.current;

      if (!map) return;

      zoomKeTrase(map);
    };

    window.addEventListener(
      'zoom-trase',
      zoomTrase
    );

    return () => {
      window.removeEventListener(
        'zoom-trase',
        zoomTrase
      );
    };

  }, []);

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
  >
    <div className="map-info">
  <span>Lon {infoPeta.lon.toFixed(5)}</span>
  <span>Lat {infoPeta.lat.toFixed(5)}</span>
  <span>Zoom {infoPeta.zoom.toFixed(1)}</span>
  <span>Kemiringan {infoPeta.pitch.toFixed(0)}°</span>
  <span>Arah {infoPeta.bearing.toFixed(0)}°</span>
</div>
  </div>
);
}

const ekspresiFilterBidang = (
  filter: {
    status: string[];
    kecamatan: string[];
    kelurahan: string[];
    tipehak: string[];
    penggunaan: string[];
  }
): any => {
  const kondisi: any[] = ['all'];

  const tambahFilter = (
    property: string,
    values: string[]
  ) => {
    if (!values.length) return;

    kondisi.push([
      'match',
      ['get', property],
      ...values.flatMap((value) => [
        value,
        true
      ]),
      false
    ]);
  };

  tambahFilter(
    'status',
    filter.status
  );

  tambahFilter(
    'kecamatan',
    filter.kecamatan
  );

  tambahFilter(
    'kelurahan',
    filter.kelurahan
  );

  tambahFilter(
    'tipehak',
    filter.tipehak
  );

  tambahFilter(
    'penggunaan',
    filter.penggunaan
  );

 if (kondisi.length === 1) {
  return [
    '==',
    ['get', '__filter_never_match__'],
    '__never__'
  ];
}

  return kondisi;
};
const fmt = (
  n: number | null
) =>
  (n ?? 0).toLocaleString(
    'id-ID'
  );

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

    // hasil analisis
    [
      'boolean',
      ['feature-state', 'analisis'],
      false
    ],
    '#00E5FF',

    // bidang terpilih
    [
  'boolean',
  ['feature-state', 'sel'],
  false
],

'#A51F35',

    // normal
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

}
