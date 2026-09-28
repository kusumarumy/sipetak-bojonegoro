'use client';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import maplibregl, {
  Map as MLMap,
  Popup
} from 'maplibre-gl';

import { Protocol } from 'pmtiles';

import {
  useApp,
  type Basemap
} from '@/store/useApp';

import {
  LAYERS,
  DTM
} from './layers';

const pmtiles = new Protocol();

let protokolTerpasang = false;

class AppScaleControl
  extends maplibregl.ScaleControl {

  private element: HTMLElement | null = null;

  onAdd(map: MLMap) {
    this.element = super.onAdd(map);
    return this.element;
  }

  getElement() {
    return this.element;
  }
}

const TRASEG_URL =
  'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/wgs84/traseg.geojson';

export default function MapCanvas() {

  const ref =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<MLMap | null>(null);

  const scaleSlotRef =
    useRef<HTMLDivElement>(null);

  const popupRef =
    useRef<Popup | null>(null);

  const terpilihRef =
    useRef<string | number | null>(null);

  const analisisRef =
    useRef<(string | number)[]>([]);

  const layerLoadingDimintaRef =
    useRef<Set<string>>(new Set());

  const [infoPeta, setInfoPeta] =
    useState({
      lon: 0,
      lat: 0,
      zoom: 0,
      pitch: 0,
      bearing: 0
    });

  const [layerLoading, setLayerLoading] =
    useState<string[]>([]);

  const {
    basemap,
    setBasemap,
    dtm,
    exag,
    labelNomor,
    modeAnalisis,
    layerAktif,
    tema,
    filterBidang,
    pilihBidang,
    beriPesan
  } = useApp();

  /*
   * =====================================================
   * ANALISIS BIDANG
   * =====================================================
   */

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

      for (
        const id of analisisRef.current
      ) {

        mapRef.current?.setFeatureState(
          {
            source: 'bidang',
            id
          },
          {
            analisis: false
          }
        );
      }

      analisisRef.current = [];

      const map =
        mapRef.current;

      if (
        !map ||
        ids.length === 0
      ) {
        return;
      }

      for (
        const id of ids
      ) {

        map.setFeatureState(
          {
            source: 'bidang',
            id
          },
          {
            analisis: true
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

  /*
   * =====================================================
   * RESET ANALISIS
   * =====================================================
   */

  useEffect(() => {

    const handleResetAnalisis = () => {

      const map =
        mapRef.current;

      popupRef.current?.remove();
      popupRef.current = null;

      if (map) {

        for (
          const id of analisisRef.current
        ) {

          map.setFeatureState(
            {
              source: 'bidang',
              id
            },
            {
              analisis: false
            }
          );
        }

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
      }

      analisisRef.current = [];
      terpilihRef.current = null;
    };

    window.addEventListener(
      'reset-analisis-bidang',
      handleResetAnalisis
    );

    return () => {

      window.removeEventListener(
        'reset-analisis-bidang',
        handleResetAnalisis
      );
    };

  }, []);

  /*
   * =====================================================
   * RESET PILIHAN BIDANG
   * =====================================================
   */

  useEffect(() => {

    const handleResetPilihanBidang = () => {

      const map =
        mapRef.current;

      if (
        map &&
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

      terpilihRef.current = null;

      popupRef.current?.remove();
      popupRef.current = null;
    };

    window.addEventListener(
      'reset-pilihan-bidang',
      handleResetPilihanBidang
    );

    return () => {

      window.removeEventListener(
        'reset-pilihan-bidang',
        handleResetPilihanBidang
      );
    };

  }, []);

  /*
   * =====================================================
   * FOKUS BIDANG
   * =====================================================
   */

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
          map.querySourceFeatures(
            'bidang'
          );

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

        if (
          feature.id !== undefined
        ) {

          sorot(
            map,
            feature.id
          );
        }

        const bounds =
          new maplibregl.LngLatBounds();

        const tambahKoordinat = (
          coords: any
        ) => {

          if (
            !Array.isArray(coords)
          ) {
            return;
          }

          if (
            coords.length >= 2 &&
            typeof coords[0] === 'number' &&
            typeof coords[1] === 'number'
          ) {

            bounds.extend(
              coords as [
                number,
                number
              ]
            );

            return;
          }

          for (
            const c of coords
          ) {

            tambahKoordinat(c);
          }
        };

        const geometry =
          feature.geometry as any;

        if (
          geometry?.coordinates
        ) {

          tambahKoordinat(
            geometry.coordinates
          );
        }

        if (
          bounds.isEmpty()
        ) {
          return;
        }

        map.fitBounds(
          bounds,
          {
            padding: {
              top: 170,
              bottom: 120,
              left: 470,
              right: 430
            },
            duration: 900,
            maxZoom: 18
          }
        );
      };

      if (
        map.isStyleLoaded()
      ) {

        fokus();

      } else {

        map.once(
          'load',
          fokus
        );
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

  /*
   * =====================================================
   * INISIALISASI MAP
   * =====================================================
   */

  useEffect(() => {

    if (
      !ref.current ||
      mapRef.current
    ) {
      return;
    }

    if (!protokolTerpasang) {

      maplibregl.addProtocol(
        'pmtiles',
        pmtiles.tile
      );

      protokolTerpasang = true;
    }

    const sources: any = {

      'esri-streets': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© Esri'
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
        'https://dppt-bojonegoro.ruli-andaru.workers.dev/orthophoto/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      minzoom: 10,
      maxzoom: 21,
      attribution:
        'Orthophoto DPPT Bojonegoro 2026'
    };

    if (DTM.trace) {

      sources.dtm = {
        type: 'raster-dem',
        tiles: [
          DTM.trace
        ],
        tileSize: 256,
        encoding: 'terrarium',
        minzoom: 17,
        maxzoom: 17
      };
    }

    if (DTM.aws) {

      sources.dtm_aws = {
        type: 'raster-dem',
        tiles: [
          DTM.aws
        ],
        tileSize: 256,
        encoding: 'terrarium',
        minzoom: 0,
        maxzoom: 15
      };
    }

    /*
     * ===================================================
     * BASEMAP
     * ===================================================
     */

    const layersAwal: any[] = [

      {
        id: 'bg',
        type: 'background',

        paint: {
          'background-color':
            '#0E1720'
        }
      },

      {
        id: 'bm-esri-streets',
        type: 'raster',
        source: 'esri-streets',

        layout: {
          visibility:
            basemap ===
            'esri-streets'
              ? 'visible'
              : 'none'
        },

        paint: {
          'raster-saturation':
            -0.5
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
        source:
          'google-hybrid',

        layout: {
          visibility:
            basemap ===
            'google-hybrid'
              ? 'visible'
              : 'none'
        }
      },

      {
        id: 'bm-google-streets',
        type: 'raster',
        source:
          'google-streets',

        layout: {
          visibility:
            basemap ===
            'google-streets'
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
            basemap ===
            'opentopo'
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

    /*
     * ===================================================
     * CREATE MAP
     * ===================================================
     */

    const map =
      new maplibregl.Map({
        container: ref.current,

        center: [
          111.879,
          -7.168
        ],

        zoom: 12.4,

        bearing: 18,

        maxPitch: 75,

        attributionControl:
          false,

        style: {
          version: 8,

          glyphs:
            'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',

          sources,

          layers:
            layersAwal
        }
      });

    mapRef.current = map;

    const sourceLayerIds =
      new Set(
        LAYERS.map(
          (layer) =>
            layer.id
        )
      );

    /*
     * ===================================================
     * LOADING LAYER
     * ===================================================
     */

    const mulaiLoadingLayer = (
      sourceId: string
    ) => {

      if (
        !sourceLayerIds.has(
          sourceId
        )
      ) {
        return;
      }

      if (
        !layerLoadingDimintaRef.current.has(
          sourceId
        )
      ) {
        return;
      }

      const layer =
        LAYERS.find(
          (l) =>
            l.id === sourceId
        );

      if (!layer) {
        return;
      }

      setLayerLoading(
        (prev) =>
          prev.includes(sourceId)
            ? prev
            : [
                ...prev,
                sourceId
              ]
      );
    };

    const selesaiLoadingLayer = (
      sourceId: string
    ) => {

      if (
        !sourceLayerIds.has(
          sourceId
        )
      ) {
        return;
      }

      layerLoadingDimintaRef.current.delete(
        sourceId
      );

      setLayerLoading(
        (prev) =>
          prev.filter(
            (id) =>
              id !== sourceId
          )
      );
    };

    const cekSumberSelesai = (
      sourceId: string
    ) => {

      requestAnimationFrame(
        () => {

          if (
            !mapRef.current ||
            !layerLoadingDimintaRef.current.has(
              sourceId
            )
          ) {
            return;
          }

          if (
            mapRef.current.isSourceLoaded(
              sourceId
            )
          ) {

            selesaiLoadingLayer(
              sourceId
            );
          }
        }
      );
    };

    const handleSourceLoading = (
      e: any
    ) => {

      const sourceId =
        e?.sourceId;

      if (!sourceId) {
        return;
      }

      mulaiLoadingLayer(
        sourceId
      );
    };

    const handleSourceData = (
      e: any
    ) => {

      const sourceId =
        e?.sourceId;

      if (!sourceId) {
        return;
      }

      if (
        e.isSourceLoaded
      ) {

        selesaiLoadingLayer(
          sourceId
        );
      }
    };

    const handleMapError = (
      e: any
    ) => {

      const sourceId =
        e?.error?.sourceId ??
        e?.sourceId;

      if (
        sourceId &&
        sourceLayerIds.has(
          sourceId
        )
      ) {

        selesaiLoadingLayer(
          sourceId
        );
      }
    };

    map.on(
      'sourcedataloading',
      handleSourceLoading
    );

    map.on(
      'sourcedata',
      handleSourceData
    );

    map.on(
      'error',
      handleMapError
    );

    /*
     * ===================================================
     * MAP INFO
     * ===================================================
     */

    const perbaruiInfoPeta =
      () => {

        const center =
          map.getCenter();

        setInfoPeta({

          lon: center.lng,

          lat: center.lat,

          zoom: map.getZoom(),

          pitch: map.getPitch(),

          bearing:
            map.getBearing()
        });
      };

    map.on(
      'move',
      perbaruiInfoPeta
    );

    map.on(
      'zoom',
      perbaruiInfoPeta
    );

    map.on(
      'rotate',
      perbaruiInfoPeta
    );

    map.on(
      'pitch',
      perbaruiInfoPeta
    );

    perbaruiInfoPeta();

    /*
     * ===================================================
     * RESIZE
     * ===================================================
     */

    const resizeObserver =
      new ResizeObserver(
        () => {
          map.resize();
        }
      );

    resizeObserver.observe(
      ref.current
    );

    /*
     * ===================================================
     * CONTROLS
     * ===================================================
     */

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true
      }),
      'top-right'
    );

    const scaleControl =
      new AppScaleControl({
        maxWidth: 100,
        unit: 'metric'
      });

    map.addControl(
      scaleControl,
      'bottom-right'
    );

    const scaleElement =
      scaleControl.getElement();

    if (
      scaleElement &&
      scaleSlotRef.current
    ) {

      scaleSlotRef.current.appendChild(
        scaleElement
      );
    }

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true
      }),
      'bottom-left'
    );

    /*
     * ===================================================
     * LOAD DATA LAYERS
     * ===================================================
     */

    map.on(
      'load',
      () => {

        for (
          const L of LAYERS
        ) {

          /*
           * Bidang dibuat khusus
           * di bawah.
           */
          if (
            L.id === 'bidang'
          ) {
            continue;
          }

          map.addSource(
            L.id,
            {
              type: 'geojson',

              data:
                L.id === 'traseg'
                  ? TRASEG_URL
                  : `/api/layers/${L.sumber}`
            }
          );

          const vis =
            layerAktif[L.id]
              ? 'visible'
              : 'none';

          /*
           * FILL
           */

          if (
            L.tipe === 'fill'
          ) {

            map.addLayer({

              id: L.id,

              type: 'fill',

              source: L.id,

              layout: {
                visibility: vis
              },

              paint: {

                'fill-color':
                  L.warna,

                'fill-opacity':
                  L.opasitas ??
                  0.45
              }
            });

            /*
             * Outline
             */

            map.addLayer({

              id:
                L.id + '-ln',

              type: 'line',

              source: L.id,

              layout: {
                visibility: vis
              },

              paint: {

                'line-color':
                  L.warna,

                'line-width':
                  1.2,

                'line-opacity':
                  0.85
              }
            });

          }

          /*
           * LINE
           */

          else if (
            L.tipe === 'line'
          ) {

            map.addLayer({

              id: L.id,

              type: 'line',

              source: L.id,

              layout: {
                visibility: vis
              },

              paint: {

                'line-color':
                  L.warna,

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

          }

          /*
           * CIRCLE
           */

          else {

            map.addLayer({

              id: L.id,

              type: 'circle',

              source: L.id,

              layout: {
                visibility: vis
              },

              paint: {

                'circle-radius':
                  4,

                'circle-color':
                  L.warna,

                'circle-stroke-width':
                  1.5,

                'circle-stroke-color':
                  '#0E1720'
              }
            });
          }
        }

        /*
         * =================================================
         * TRASE HALO
         * =================================================
         */

        if (
          map.getSource('traseg') &&
          map.getLayer('traseg')
        ) {

          map.addLayer(
            {
              id:
                'traseg_halo',

              type: 'line',

              source:
                'traseg',

              layout: {
                visibility:
                  layerAktif.traseg
                    ? 'visible'
                    : 'none'
              },

              paint: {

                'line-color':
                  '#FFFFFF',

                'line-width': [
                  '+',

                  [
                    'coalesce',

                    [
                      'to-number',

                      LAYERS.find(
                        (l) =>
                          l.id ===
                          'traseg'
                      )?.lebar ??
                        4
                    ],

                    4
                  ],

                  4
                ],

                'line-opacity':
                  0.95
              }
            },

            'traseg'
          );
        }

        /*
         * =================================================
         * BIDANG TANAH
         * =================================================
         */

        map.addSource(
          'bidang',
          {
            type: 'geojson',

            data:
              '/api/bidang',

            promoteId:
              'id'
          }
        );

        map.addLayer({

          id:
            'bidang',

          type:
            'fill',

          source:
            'bidang',

          paint: {

            'fill-color': [
              'case',

              [
                'boolean',
                [
                  'feature-state',
                  'analisis'
                ],
                false
              ],

              '#00E5FF',

              [
                'boolean',
                [
                  'feature-state',
                  'sel'
                ],
                false
              ],

              '#FFD600',

              '#8df2ff'
            ],

            'fill-opacity': [
              'case',

              [
                'boolean',
                [
                  'feature-state',
                  'analisis'
                ],
                false
              ],

              0.88,

              [
                'boolean',
                [
                  'feature-state',
                  'filter'
                ],
                false
              ],

              0.92,

              [
                'boolean',
                [
                  'feature-state',
                  'sel'
                ],
                false
              ],

              0.95,

              [
                'boolean',
                [
                  'feature-state',
                  'hov'
                ],
                false
              ],

              0.74,

              0.90
            ]
          }
        });

        /*
         * Trase tetap berada
         * di bawah layer data.
         */

        posisikanTraseDiBawahLayerData(
          map
        );

        /*
         * =================================================
         * OUTLINE BIDANG
         * =================================================
         */

        map.addLayer({

          id:
            'bidang-ln',

          type:
            'line',

          source:
            'bidang',

          paint: {

            'line-color': [
              'case',

              [
                'boolean',
                [
                  'feature-state',
                  'analisis'
                ],
                false
              ],

              '#00E5FF',

              [
                'boolean',
                [
                  'feature-state',
                  'filter'
                ],
                false
              ],

              '#FFFFFF',

              [
                'boolean',
                [
                  'feature-state',
                  'sel'
                ],
                false
              ],

              '#FFFFFF',

              'rgba(14,23,32,.45)'
            ],

            'line-width': [
              'case',

              [
                'boolean',
                [
                  'feature-state',
                  'analisis'
                ],
                false
              ],

              2.5,

              [
                'boolean',
                [
                  'feature-state',
                  'filter'
                ],
                false
              ],

              2.2,

              [
                'boolean',
                [
                  'feature-state',
                  'sel'
                ],
                false
              ],

              3,

              0.6
            ],

            'line-opacity': [
              'case',

              [
                'boolean',
                [
                  'feature-state',
                  'filter'
                ],
                false
              ],

              1,

              0.65
            ]
          }
        });

        /*
         * =================================================
         * LABEL BIDANG
         * =================================================
         */

        map.addLayer({

          id:
            'bidang-lb',

          type:
            'symbol',

          source:
            'bidang',

          minzoom:
            13,

          layout: {

            visibility:
              'none',

            'text-field': [
              'to-string',

              [
                'get',
                'nib'
              ]
            ],

            'text-size':
              12,

            'text-anchor':
              'center',

            'text-allow-overlap':
              true,

            'text-ignore-placement':
              true
          },

          paint: {

            'text-color':
              '#1E2733',

            'text-halo-color':
              'rgba(255,255,255,.9)',

            'text-halo-width':
              1.1
          }
        });

        /*
         * =================================================
         * FILTER BIDANG
         * =================================================
         */

        map.addLayer({

          id:
            'bidang-filter',

          type:
            'fill',

          source:
            'bidang',

          filter: [
            '==',

            [
              'get',
              '__filter_never_match__'
            ],

            '__never__'
          ],

          paint: {

            'fill-color':
              '#FF1744',

            'fill-opacity':
              0.30
          }
        });

        map.addLayer({

          id:
            'bidang-filter-ln',

          type:
            'line',

          source:
            'bidang',

          filter: [
            '==',

            [
              'get',
              '__filter_never_match__'
            ],

            '__never__'
          ],

          paint: {

            'line-color':
              '#FF1744',

            'line-width':
              3,

            'line-opacity':
              1
          }
        });

        /*
         * =================================================
         * BANGUNAN DI ATAS BIDANG
         * =================================================
         */

        posisikanBangunanDiAtasBidang(
          map
        );

        /*
         * =================================================
         * TEMA
         * =================================================
         */

        warnaiTema(map);

        /*
         * =================================================
         * INTERAKSI
         * =================================================
         */

        pasangInteraksi(map);
      }
    );

    /*
     * ===================================================
     * MAP ERROR
     * ===================================================
     */

    map.on(
      'error',
      (e) => {

        console.warn(
          'MapLibre:',
          e.error?.message ?? e
        );
      }
    );

    /*
     * ===================================================
     * CLEANUP
     * ===================================================
     */

    return () => {

      resizeObserver.disconnect();

      map.off(
        'sourcedataloading',
        handleSourceLoading
      );

      map.off(
        'sourcedata',
        handleSourceData
      );

      map.off(
        'error',
        handleMapError
      );

      layerLoadingDimintaRef.current.clear();

      setLayerLoading([]);

      popupRef.current?.remove();

      for (
        const id of analisisRef.current
      ) {

        map.setFeatureState(
          {
            source: 'bidang',
            id
          },
          {
            analisis: false
          }
        );
      }

      analisisRef.current = [];

      map.remove();

      mapRef.current = null;
    };

  }, []);

  /*
   * =====================================================
   * INTERAKSI
   * =====================================================
   */

  function pasangInteraksi(
    map: MLMap
  ) {

    let hov:
      | string
      | number
      | null = null;

    /*
     * ===================================================
     * HOVER BIDANG
     * ===================================================
     */

    map.on(
      'mousemove',
      'bidang',
      (e) => {

        map.getCanvas()
          .style.cursor =
          'pointer';

        const id =
          e.features?.[0]?.id;

        if (
          id === undefined
        ) {
          return;
        }

        if (
          hov !== null
        ) {

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

        map.getCanvas()
          .style.cursor = '';

        if (
          hov !== null
        ) {

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

    /*
     * ===================================================
     * CLICK BIDANG
     * ===================================================
     */

    map.on(
      'click',
      'bidang',
      (e) => {

        const f =
          e.features?.[0];

        if (!f) {
          return;
        }

        const p =
          f.properties as any;

        popupRef.current?.remove();

        const el =
          document.createElement(
            'div'
          );

        el.className =
          'pop';

        el.innerHTML = `
          <div class="ph">

            <div class="id">
              ${escapeHtml(
                p.nib ??
                'NIB tidak tersedia'
              )}
            </div>

            <div class="nm">
              ${escapeHtml(
                p.nama_milik ??
                'Nama pemilik tidak tersedia'
              )}
            </div>

          </div>

          <div class="pb">

            <div>
              <span>
                Luas bidang
              </span>

              <b>
                ${fmt(
                  p.luas_tnh
                )} m²
              </b>
            </div>

            <div>
              <span>
                Penggunaan
              </span>

              <b
                style="font-family:var(--f-body)"
              >
                ${escapeHtml(
                  p.penggunaan ??
                  '—'
                )}
              </b>
            </div>

          </div>

          <button>
            Buka kartu bidang
          </button>
        `;

        el
          .querySelector(
            'button'
          )!
          .addEventListener(
            'click',
            () => {

              pilihBidang(
                p.id
              );

              if (
                f.id !== undefined
              ) {

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

            closeButton:
              true,

            offset:
              12,

            maxWidth:
              'none'
          })
            .setLngLat(
              e.lngLat
            )
            .setDOMContent(
              el
            )
            .addTo(map);
      }
    );

    /*
     * ===================================================
     * HOVER BANGUNAN
     * ===================================================
     */

    map.on(
      'mousemove',
      'bangunan',
      () => {

        map.getCanvas()
          .style.cursor =
          'pointer';
      }
    );

    map.on(
      'mouseleave',
      'bangunan',
      () => {

        map.getCanvas()
          .style.cursor =
          '';
      }
    );

    /*
     * ===================================================
     * CLICK BANGUNAN
     * ===================================================
     */

    map.on(
      'click',
      'bangunan',
      (e) => {

        const f =
          e.features?.[0];

        if (!f) {
          return;
        }

        const p =
          f.properties as any;

        popupRef.current?.remove();

        const foto =
          safeImageUrl(
            p.foto_bgn
          );

        const fotoHtml =
          foto
            ? `
              <div
                style="
                  width:100%;
                  height:190px;
                  border-radius:14px;
                  overflow:hidden;
                  background:#EEF2F7;
                  margin-bottom:14px;
                "
              >
                <img
                  src="${foto}"
                  alt="Foto bangunan"
                  style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    display:block;
                  "
                  onerror="
                    this.style.display='none';
                  "
                />
              </div>
            `
            : '';

        const el =
          document.createElement(
            'div'
          );

        el.className =
          'pop bangunan-pop';

        el.innerHTML = `
          <div
            style="
              width:390px;
              max-width:calc(100vw - 50px);
              font-family:var(--f-body,Arial,sans-serif);
              color:#1E2733;
            "
          >

            ${fotoHtml}

            <div
              style="
                display:flex;
                align-items:flex-start;
                justify-content:space-between;
                gap:14px;
                margin-bottom:14px;
              "
            >

              <div>

                <div
                  style="
                    font-size:11px;
                    font-weight:800;
                    letter-spacing:.08em;
                    color:#718096;
                    text-transform:uppercase;
                    margin-bottom:4px;
                  "
                >
                  KARTU BANGUNAN
                </div>

                <div
                  style="
                    font-size:23px;
                    line-height:1.1;
                    font-weight:800;
                    color:#17202B;
                  "
                >
                  ${escapeHtml(
                    p.id ??
                    p.fid ??
                    '—'
                  )}
                </div>

                <div
                  style="
                    font-size:13px;
                    color:#718096;
                    margin-top:5px;
                  "
                >
                  ${escapeHtml(
                    p.jenis_bgn ??
                    'Jenis bangunan tidak tersedia'
                  )}
                </div>

              </div>

              <div
                style="
                  background:#EEF3F8;
                  color:#42617D;
                  border-radius:999px;
                  padding:7px 11px;
                  font-size:11px;
                  font-weight:700;
                  white-space:nowrap;
                "
              >
                Bangunan
              </div>

            </div>

            <div
              style="
                border:1px solid #E1E7EF;
                border-radius:14px;
                padding:15px;
                background:#FFFFFF;
              "
            >

              <div
                style="
                  font-size:15px;
                  font-weight:800;
                  margin-bottom:4px;
                  color:#17202B;
                "
              >
                Informasi bangunan
              </div>

              <div
                style="
                  font-size:12px;
                  color:#718096;
                  margin-bottom:14px;
                "
              >
                Data bangunan hasil inventarisasi
              </div>

              <div
                style="
                  display:grid;
                  grid-template-columns:1fr 1fr;
                  gap:16px 20px;
                "
              >

                <div>
                  <div
                    style="
                      font-size:10px;
                      font-weight:700;
                      color:#718096;
                      text-transform:uppercase;
                      margin-bottom:4px;
                    "
                  >
                    FID
                  </div>

                  <div
                    style="
                      font-size:13px;
                      color:#17202B;
                    "
                  >
                    ${escapeHtml(
                      p.fid ??
                      '—'
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style="
                      font-size:10px;
                      font-weight:700;
                      color:#718096;
                      text-transform:uppercase;
                      margin-bottom:4px;
                    "
                  >
                    ID
                  </div>

                  <div
                    style="
                      font-size:13px;
                      color:#17202B;
                    "
                  >
                    ${escapeHtml(
                      p.id ??
                      '—'
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style="
                      font-size:10px;
                      font-weight:700;
                      color:#718096;
                      text-transform:uppercase;
                      margin-bottom:4px;
                    "
                  >
                    JENIS BANGUNAN
                  </div>

                  <div
                    style="
                      font-size:13px;
                      color:#17202B;
                    "
                  >
                    ${escapeHtml(
                      p.jenis_bgn ??
                      '—'
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style="
                      font-size:10px;
                      font-weight:700;
                      color:#718096;
                      text-transform:uppercase;
                      margin-bottom:4px;
                    "
                  >
                    FUNGSI BANGUNAN
                  </div>

                  <div
                    style="
                      font-size:13px;
                      color:#17202B;
                    "
                  >
                    ${escapeHtml(
                      p.fungsi_bgn ??
                      '—'
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style="
                      font-size:10px;
                      font-weight:700;
                      color:#718096;
                      text-transform:uppercase;
                      margin-bottom:4px;
                    "
                  >
                    JUMLAH BANGUNAN
                  </div>

                  <div
                    style="
                      font-size:13px;
                      color:#17202B;
                    "
                  >
                    ${fmt(
                      p.jml_bgn
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style="
                      font-size:10px;
                      font-weight:700;
                      color:#718096;
                      text-transform:uppercase;
                      margin-bottom:4px;
                    "
                  >
                    JUMLAH LANTAI
                  </div>

                  <div
                    style="
                      font-size:13px;
                      color:#17202B;
                    "
                  >
                    ${fmt(
                      p.jml_lnt
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style="
                      font-size:10px;
                      font-weight:700;
                      color:#718096;
                      text-transform:uppercase;
                      margin-bottom:4px;
                    "
                  >
                    LUAS BANGUNAN
                  </div>

                  <div
                    style="
                      font-size:13px;
                      font-weight:700;
                      color:#17202B;
                    "
                  >
                    ${fmt(
                      p.luas_bgn
                    )} m²
                  </div>
                </div>

                <div>
                  <div
                    style="
                      font-size:10px;
                      font-weight:700;
                      color:#718096;
                      text-transform:uppercase;
                      margin-bottom:4px;
                    "
                  >
                    TANGGAL UPDATE
                  </div>

                  <div
                    style="
                      font-size:13px;
                      color:#17202B;
                    "
                  >
                    ${escapeHtml(
                      p.date_updt ??
                      '—'
                    )}
                  </div>
                </div>

              </div>

              <div
                style="
                  margin-top:17px;
                  padding-top:15px;
                  border-top:1px solid #E8EDF3;
                "
              >

                <div
                  style="
                    font-size:10px;
                    font-weight:700;
                    color:#718096;
                    text-transform:uppercase;
                    margin-bottom:5px;
                  "
                >
                  ALAMAT BANGUNAN
                </div>

                <div
                  style="
                    font-size:13px;
                    line-height:1.5;
                    color:#17202B;
                  "
                >
                  ${escapeHtml(
                    p.alamat_bgn ??
                    '—'
                  )}
                </div>

              </div>

              <div
                style="
                  margin-top:15px;
                  padding-top:15px;
                  border-top:1px solid #E8EDF3;
                "
              >

                <div
                  style="
                    font-size:10px;
                    font-weight:700;
                    color:#718096;
                    text-transform:uppercase;
                    margin-bottom:5px;
                  "
                >
                  UPDATE
                </div>

                <div
                  style="
                    font-size:13px;
                    line-height:1.5;
                    color:#17202B;
                  "
                >
                  ${escapeHtml(
                    p.update ??
                    '—'
                  )}
                </div>

              </div>

              ${
                !foto &&
                p.foto_bgn
                  ? `
                    <div
                      style="
                        margin-top:15px;
                        padding-top:15px;
                        border-top:1px solid #E8EDF3;
                      "
                    >
                      <div
                        style="
                          font-size:10px;
                          font-weight:700;
                          color:#718096;
                          text-transform:uppercase;
                          margin-bottom:5px;
                        "
                      >
                        FOTO BANGUNAN
                      </div>

                      <div
                        style="
                          font-size:13px;
                          color:#17202B;
                          word-break:break-word;
                        "
                      >
                        ${escapeHtml(
                          p.foto_bgn
                        )}
                      </div>
                    </div>
                  `
                  : ''
              }

            </div>

          </div>
        `;

        popupRef.current =
          new maplibregl.Popup({

            closeButton:
              true,

            offset:
              14,

            maxWidth:
              'none'
          })
            .setLngLat(
              e.lngLat
            )
            .setDOMContent(
              el
            )
            .addTo(map);
      }
    );
  }

  /*
   * =====================================================
   * SOROT BIDANG
   * =====================================================
   */

  function sorot(
    map: MLMap,
    fid: string | number
  ) {

    if (
      terpilihRef.current !==
      null
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

  /*
   * =====================================================
   * BASEMAP
   * =====================================================
   */

  useEffect(() => {

    const map =
      mapRef.current;

    if (
      !map?.isStyleLoaded()
    ) {
      return;
    }

    const basemapLayers: {
      id: string;
      basemap: Basemap;
    }[] = [

      {
        id:
          'bm-esri-streets',

        basemap:
          'esri-streets'
      },

      {
        id:
          'bm-esri',

        basemap:
          'esri'
      },

      {
        id:
          'bm-google-hybrid',

        basemap:
          'google-hybrid'
      },

      {
        id:
          'bm-google-streets',

        basemap:
          'google-streets'
      },

      {
        id:
          'bm-opentopo',

        basemap:
          'opentopo'
      },

      {
        id:
          'bm-ortho',

        basemap:
          'ortho'
      }
    ];

    for (
      const item of basemapLayers
    ) {

      if (
        !map.getLayer(
          item.id
        )
      ) {
        continue;
      }

      const visible =
        item.id === 'bm-esri'
          ? basemap === 'esri' ||
            basemap === 'ortho'
          : item.basemap ===
            basemap;

      map.setLayoutProperty(
        item.id,
        'visibility',
        visible
          ? 'visible'
          : 'none'
      );
    }

  }, [
    basemap,
    beriPesan
  ]);

  /*
   * =====================================================
   * DTM
   * =====================================================
   */

  useEffect(() => {

    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const terapkanDTM =
      () => {

        if (
          !map.isStyleLoaded()
        ) {
          return;
        }

        if (
          dtm === 'off'
        ) {

          map.setTerrain(
            null
          );

          map.easeTo({
            pitch: 0,
            duration: 850
          });

          return;
        }

        const src =
          dtm === 'trace'
            ? 'dtm'
            : 'dtm_aws';

        const urlDTM =
          dtm === 'trace'
            ? DTM.trace
            : DTM.aws;

        if (!urlDTM) {

          map.setTerrain(
            null
          );

          beriPesan(
            `DTM ${
              dtm === 'trace'
                ? 'Rencana Trace'
                : 'AWS'
            } belum tersedia.`
          );

          return;
        }

        if (
          !map.getSource(src)
        ) {

          console.warn(
            'Source DTM tidak ditemukan:',
            src
          );

          map.setTerrain(
            null
          );

          beriPesan(
            `Source ${
              dtm === 'trace'
                ? 'DTM Rencana Trace'
                : 'DTM AWS'
            } belum tersedia.`
          );

          return;
        }

        map.setTerrain(
          null
        );

        map.setTerrain({
          source: src,
          exaggeration:
            exag ?? 1
        });

        map.easeTo({
          pitch: 52,
          duration: 850
        });
      };

    if (
      map.isStyleLoaded()
    ) {

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

  }, [
    dtm,
    exag,
    beriPesan
  ]);

  /*
   * =====================================================
   * LABEL NOMOR BIDANG
   * =====================================================
   */

  useEffect(() => {

    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const perbaruiLabelNomor =
      () => {

        if (
          !map.isStyleLoaded() ||
          !map.getLayer(
            'bidang-lb'
          )
        ) {
          return;
        }

        const zoom =
          map.getZoom();

        map.setLayoutProperty(
          'bidang-lb',
          'visibility',
          zoom >= 15
            ? 'visible'
            : 'none'
        );
      };

    if (
      map.isStyleLoaded()
    ) {

      perbaruiLabelNomor();

    } else {

      map.once(
        'load',
        perbaruiLabelNomor
      );
    }

    map.on(
      'zoom',
      perbaruiLabelNomor
    );

    return () => {

      map.off(
        'zoom',
        perbaruiLabelNomor
      );
    };

  }, []);

  /*
   * =====================================================
   * VISIBILITY LAYER
   * =====================================================
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
      const L of LAYERS
    ) {

      const aktif =
        !!layerAktif[L.id];

      const v =
        aktif
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

      if (aktif) {

        layerLoadingDimintaRef.current.add(
          L.id
        );

        if (
          map.isSourceLoaded(
            L.id
          )
        ) {

          selesaiLoadingLayerAktif(
            L.id
          );

        } else {

          cekLoadingLayerAktif(
            L.id,
            map
          );
        }

      } else {

        layerLoadingDimintaRef.current.delete(
          L.id
        );

        setLayerLoading(
          (prev) =>
            prev.filter(
              (id) =>
                id !== L.id
            )
        );
      }
    }

    /*
     * Trase
     */

    if (
      map.getLayer(
        'traseg'
      )
    ) {

      map.setLayoutProperty(
        'traseg',
        'visibility',

        layerAktif.traseg
          ? 'visible'
          : 'none'
      );
    }

    if (
      map.getLayer(
        'traseg_halo'
      )
    ) {

      map.setLayoutProperty(
        'traseg_halo',
        'visibility',

        layerAktif.traseg
          ? 'visible'
          : 'none'
      );
    }

    /*
     * Pastikan bangunan
     * tetap di atas bidang.
     */

    posisikanBangunanDiAtasBidang(
      map
    );

    posisikanTraseDiBawahLayerData(
      map
    );

  }, [
    layerAktif
  ]);

  /*
   * =====================================================
   * FILTER BIDANG
   * =====================================================
   */

  useEffect(() => {

    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const terapkanFilter =
      () => {

        if (
          !map.getLayer(
            'bidang-filter'
          ) ||
          !map.getLayer(
            'bidang-filter-ln'
          )
        ) {
          return;
        }

        const expression =
          ekspresiFilterBidang(
            filterBidang
          );

        map.setFilter(
          'bidang-filter',
          expression
        );

        map.setFilter(
          'bidang-filter-ln',
          expression
        );
      };

    if (
      map.isStyleLoaded()
    ) {

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

  }, [
    filterBidang
  ]);

  /*
   * =====================================================
   * TEMA
   * =====================================================
   */

  useEffect(() => {

    const map =
      mapRef.current;

    if (
      map?.isStyleLoaded()
    ) {

      warnaiTema(
        map
      );
    }

  }, [
    tema
  ]);

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (

    <div
      ref={ref}
      className="canvas"
    >

      {layerLoading.length > 0 && (

        <div className="layer-loading">

          <strong className="layer-loading-title">
            MEMUAT LAYER
          </strong>

          <div className="layer-loading-text">

            {(() => {

              const namaLayer =
                layerLoading
                  .map(
                    (id) =>
                      LAYERS.find(
                        (layer) =>
                          layer.id === id
                      )?.nama
                  )
                  .filter(Boolean) as string[];

              if (
                namaLayer.length === 0
              ) {

                return 'Layer sedang dimuat...';
              }

              let daftarLayer = '';

              if (
                namaLayer.length === 1
              ) {

                daftarLayer =
                  namaLayer[0];

              } else if (
                namaLayer.length === 2
              ) {

                daftarLayer =
                  `${namaLayer[0]} dan ${namaLayer[1]}`;

              } else {

                daftarLayer =
                  namaLayer
                    .slice(0, -1)
                    .join(', ') +
                  ', dan ' +
                  namaLayer[
                    namaLayer.length - 1
                  ];
              }

              return `${daftarLayer} sedang dimuat...`;

            })()}

          </div>

        </div>
      )}

      <div className="map-bottom-right">

        <div
          ref={scaleSlotRef}
          className="map-scale-slot"
        />

        <div className="map-info">

          <span>
            Lon{' '}
            {infoPeta.lon.toFixed(5)}
          </span>

          <span>
            Lat{' '}
            {infoPeta.lat.toFixed(5)}
          </span>

          <span>
            Zoom{' '}
            {infoPeta.zoom.toFixed(1)}
          </span>

          <span>
            Kemiringan{' '}
            {infoPeta.pitch.toFixed(0)}
            °
          </span>

          <span>
            Arah{' '}
            {infoPeta.bearing.toFixed(0)}
            °
          </span>

        </div>

      </div>

    </div>
  );
}

/*
 * =======================================================
 * LOADING HELPERS
 * =======================================================
 */

function selesaiLoadingLayerAktif(
  sourceId: string
) {
  return sourceId;
}

function cekLoadingLayerAktif(
  sourceId: string,
  map: MLMap
) {

  requestAnimationFrame(
    () => {

      if (
        map.isSourceLoaded(
          sourceId
        )
      ) {
        return;
      }
    }
  );
}

/*
 * =======================================================
 * FILTER BIDANG
 * =======================================================
 */

const ekspresiFilterBidang = (
  filter: {
    status: string[];
    kecamatan: string[];
    kelurahan: string[];
    tipehak: string[];
    penggunaan: string[];
  }
): any => {

  const kondisi: any[] =
    ['all'];

  const tambahFilter = (
    property: string,
    values: string[]
  ) => {

    if (
      !values.length
    ) {
      return;
    }

    kondisi.push([
      'match',

      [
        'get',
        property
      ],

      ...values.flatMap(
        (value) => [
          value,
          true
        ]
      ),

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

  if (
    kondisi.length === 1
  ) {

    return [
      '==',

      [
        'get',
        '__filter_never_match__'
      ],

      '__never__'
    ];
  }

  return kondisi;
};

/*
 * =======================================================
 * FORMAT
 * =======================================================
 */

const fmt = (
  n:
    number |
    string |
    null |
    undefined
) => {

  if (
    n === null ||
    n === undefined ||
    n === ''
  ) {

    return '—';
  }

  const number =
    Number(n);

  if (
    Number.isNaN(number)
  ) {

    return escapeHtml(
      String(n)
    );
  }

  return number.toLocaleString(
    'id-ID'
  );
};

/*
 * =======================================================
 * ESCAPE HTML
 * =======================================================
 */

function escapeHtml(
  value: any
): string {

  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}

/*
 * =======================================================
 * FOTO BANGUNAN
 * =======================================================
 */

function safeImageUrl(
  value: any
): string | null {

  if (
    !value ||
    typeof value !== 'string'
  ) {

    return null;
  }

  const valueTrim =
    value.trim();

  if (!valueTrim) {
    return null;
  }

  /*
   * URL absolute.
   */

  if (
    valueTrim.startsWith(
      'https://'
    ) ||
    valueTrim.startsWith(
      'http://'
    )
  ) {

    return escapeHtml(
      valueTrim
    );
  }

  /*
   * Path lokal/web.
   */

  if (
    valueTrim.startsWith('/')
  ) {

    return escapeHtml(
      valueTrim
    );
  }

  return null;
}

/*
 * =======================================================
 * POSISI TRASE
 * =======================================================
 */

function posisikanTraseDiBawahLayerData(
  map: MLMap
) {

  if (
    !map.getLayer(
      'traseg_halo'
    ) ||
    !map.getLayer(
      'traseg'
    )
  ) {

    return;
  }

  /*
   * Trase berada di atas basemap,
   * tetapi di bawah layer data.
   */

  const layerPertama =
    LAYERS.find(
      (L) =>
        L.id !== 'traseg' &&
        map.getLayer(
          L.id
        )
    )?.id;

  const target =
    layerPertama ??
    (
      map.getLayer(
        'bidang'
      )
        ? 'bidang'
        : undefined
    );

  if (!target) {
    return;
  }

  map.moveLayer(
    'traseg_halo',
    target
  );

  map.moveLayer(
    'traseg',
    target
  );
}

/*
 * =======================================================
 * POSISI BANGUNAN DI ATAS BIDANG
 * =======================================================
 */

function posisikanBangunanDiAtasBidang(
  map: MLMap
) {

  if (
    !map.getLayer(
      'bangunan'
    )
  ) {
    return;
  }

  /*
   * Target bidang-ln berarti:
   *
   * bidang fill
   * ↓
   * bangunan
   * bangunan outline
   * ↓
   * bidang outline
   * ↓
   * label bidang
   *
   * Jadi bangunan terlihat jelas
   * di atas bidang tanah.
   */

  if (
    map.getLayer(
      'bidang-ln'
    )
  ) {

    map.moveLayer(
      'bangunan',
      'bidang-ln'
    );

    if (
      map.getLayer(
        'bangunan-ln'
      )
    ) {

      map.moveLayer(
        'bangunan-ln',
        'bidang-ln'
      );
    }

    return;
  }

  /*
   * Fallback apabila bidang-ln
   * belum tersedia.
   */

  if (
    map.getLayer(
      'bidang'
    )
  ) {

    map.moveLayer(
      'bangunan',
      'bidang'
    );

    if (
      map.getLayer(
        'bangunan-ln'
      )
    ) {

      map.moveLayer(
        'bangunan-ln',
        'bidang'
      );
    }
  }
}

/*
 * =======================================================
 * TEMA
 * =======================================================
 */

function warnaiTema(
  map: MLMap
) {

  const gelap =
    document
      .documentElement
      .dataset
      .theme ===
    'dark';

  if (
    map.getLayer(
      'bg'
    )
  ) {

    map.setPaintProperty(
      'bg',
      'background-color',

      gelap
        ? '#0E1720'
        : '#E7EBF3'
    );
  }

  if (
    map.getLayer(
      'bm-esri-streets'
    )
  ) {

    map.setPaintProperty(
      'bm-esri-streets',
      'raster-brightness-max',

      gelap
        ? 0.84
        : 1
    );
  }

  /*
   * Bidang outline
   */

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
          [
            'feature-state',
            'analisis'
          ],
          false
        ],

        '#00E5FF',

        [
          'boolean',
          [
            'feature-state',
            'sel'
          ],
          false
        ],

        '#A51F35',

        gelap
          ? 'rgba(14,23,32,.85)'
          : 'rgba(30,39,51,.5)'
      ]
    );
  }

  /*
   * Label bidang
   */

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
