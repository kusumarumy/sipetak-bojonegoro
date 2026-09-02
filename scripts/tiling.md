# Tiling ortho, DTM, dan kontur

Semua keluaran berupa **PMTiles** — satu berkas per layer, ditaruh di R2, dibaca
langsung oleh peramban lewat HTTP range request. Tidak ada server tile yang perlu
dijalankan atau dibayar.

Yang dibutuhkan: GDAL 3.8+, `pmtiles` CLI, `tippecanoe`, dan `rio-rgbify`.

```bash
# Ubuntu
sudo apt install gdal-bin
pip install rio-rgbify --break-system-packages
# pmtiles CLI: https://github.com/protomaps/go-pmtiles/releases
# tippecanoe:  https://github.com/felt/tippecanoe
```

---

## 1. Orthophoto → basemap raster

Untuk 5.000–6.000 ha pada resolusi ~7–10 cm, siapkan ruang disk beberapa ratus GB
untuk berkas antara. Kerjakan di mesin dengan SSD lega, bukan laptop.

```bash
# a. Satukan bila ortho terpecah per blok, dan buang nodata hitam
gdalbuildvrt -srcnodata "0 0 0" -vrtnodata "0 0 0" ortho.vrt blok/*.tif

# b. Proyeksikan ke Web Mercator + tambahkan alpha (agar tepi tidak jadi kotak hitam)
gdalwarp -t_srs EPSG:3857 -dstalpha -r cubic \
         -co TILED=YES -co COMPRESS=JPEG -co JPEG_QUALITY=88 -co PHOTOMETRIC=YCBCR \
         -multi -wo NUM_THREADS=ALL_CPUS \
         ortho.vrt ortho_3857.tif

# c. Jadikan MBTiles. Zoom 22 ≈ 3,7 cm/piksel — cukup untuk ortho 7 cm.
gdal_translate -of MBTILES -co TILE_FORMAT=JPEG -co QUALITY=85 \
               -co ZOOM_LEVEL_STRATEGY=UPPER \
               ortho_3857.tif bjn-ortho.mbtiles
gdaladdo -r average bjn-ortho.mbtiles 2 4 8 16 32 64 128 256

# d. Konversi ke PMTiles
pmtiles convert bjn-ortho.mbtiles bjn-ortho.pmtiles
```

JPEG, bukan PNG. Untuk citra udara ukurannya bisa 5–10 kali lebih kecil dengan
selisih kualitas yang tidak terlihat di layar.

---

## 2. DTM → terrain 3D

MapLibre membaca elevasi sebagai warna RGB. Dua DTM diproses dengan cara sama,
hanya berkas masukannya berbeda.

```bash
for SUMBER in lidar foto; do
  gdalwarp -t_srs EPSG:3857 -r bilinear -dstnodata -9999 \
           dtm_${SUMBER}.tif dtm_${SUMBER}_3857.tif

  # Terrain-RGB gaya Mapbox. Basis dan interval harus cocok dengan
  # encoding:'mapbox' di MapCanvas.tsx
  rio rgbify -b -10000 -i 0.1 dtm_${SUMBER}_3857.tif dtm_${SUMBER}_rgb.tif

  gdal_translate -of MBTILES -co TILE_FORMAT=PNG \
                 dtm_${SUMBER}_rgb.tif bjn-dtm-${SUMBER}.mbtiles
  gdaladdo -r nearest bjn-dtm-${SUMBER}.mbtiles 2 4 8 16 32
  pmtiles convert bjn-dtm-${SUMBER}.mbtiles bjn-dtm-${SUMBER}.pmtiles
done
```

PNG di sini, bukan JPEG. Kompresi JPEG bersifat lossy dan akan merusak nilai
elevasi yang tersimpan di kanal warna — permukaan jadi bergelombang palsu.

`gdaladdo -r nearest`, bukan `average`, dengan alasan yang sama.

---

## 3. Kontur 0,5 m → vector tiles

Kontur 0,5 m di area 5.000 ha menghasilkan jutaan simpul. Jangan disajikan
sebagai GeoJSON.

```bash
for SUMBER in lidar foto; do
  # Bangkitkan kontur bila belum ada
  gdal_contour -a elev -i 0.5 dtm_${SUMBER}_3857.tif kontur_${SUMBER}.gpkg

  # Tandai kontur indeks (kelipatan 2,5 m) supaya bisa digambar lebih tebal
  ogr2ogr -f GeoJSONSeq kontur_${SUMBER}.geojsonl kontur_${SUMBER}.gpkg \
    -sql "SELECT elev, CASE WHEN CAST(elev*10 AS INTEGER) % 25 = 0 THEN 1 ELSE 0 END AS mayor
          FROM contour"

  # -Z13: kontur tidak muncul saat zoom jauh. Nama layer harus 'kontur',
  # sesuai 'source-layer' di MapCanvas.tsx
  tippecanoe -o bjn-kontur-${SUMBER}.mbtiles -l kontur \
             -Z13 -z18 --drop-densest-as-needed --extend-zooms-if-still-dropping \
             --simplification=4 --force kontur_${SUMBER}.geojsonl

  pmtiles convert bjn-kontur-${SUMBER}.mbtiles bjn-kontur-${SUMBER}.pmtiles
done
```

---

## 4. Unggah ke R2

```bash
# Bucket tiles boleh publik (isinya bukan data pribadi) — beda dengan bucket
# foto & dokumen yang harus privat.
rclone copy bjn-ortho.pmtiles        r2:dppt-tiles/ --progress
rclone copy bjn-dtm-lidar.pmtiles    r2:dppt-tiles/ --progress
rclone copy bjn-dtm-foto.pmtiles     r2:dppt-tiles/ --progress
rclone copy bjn-kontur-lidar.pmtiles r2:dppt-tiles/ --progress
rclone copy bjn-kontur-foto.pmtiles  r2:dppt-tiles/ --progress
```

PMTiles butuh HTTP range request. Di Cloudflare, aktifkan CORS pada bucket
dengan `AllowedHeaders: ["range"]` dan `ExposeHeaders: ["content-range"]`,
lalu isi `NEXT_PUBLIC_TILES_*` di `.env` dengan URL publiknya.

Kalau ortho ternyata ikut dianggap rahasia oleh pimpinan, taruh bucket tiles di
belakang Cloudflare Access atau Worker yang memeriksa cookie sesi. Tapi ingat:
begitu ortho ditutup, setiap permintaan tile ikut menanggung ongkos pemeriksaan.
