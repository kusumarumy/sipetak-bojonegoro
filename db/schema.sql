-- =====================================================================
-- DPPT BOJONEGORO — SKEMA BASIS DATA
-- PostgreSQL 15+ / PostGIS 3.4+
-- Jalankan: psql "$DATABASE_URL" -f db/schema.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- ENUM ----------
DO $$ BEGIN
  CREATE TYPE peran AS ENUM ('pendata','supervisor','pelihat','pengembang');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_bidang AS ENUM ('draft','terkirim','terverifikasi','revisi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kategori_lampiran AS ENUM (
    'foto_bidang','foto_bangunan_depan','foto_bangunan_kiri','foto_bangunan_kanan',
    'foto_bangunan_belakang','foto_patok','foto_tanaman','foto_benda_lain',
    'foto_akses','foto_pemilik_petugas',
    'dok_ktp','dok_kk','dok_sertipikat','dok_sppt','dok_ahli_waris',
    'dok_kuasa','dok_rekening','dok_berita_acara','lainnya');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- PENGGUNA ----------
CREATE TABLE IF NOT EXISTS pengguna (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username       text UNIQUE NOT NULL,
  nama           text NOT NULL,
  password_hash  text NOT NULL,
  peran          peran NOT NULL DEFAULT 'pelihat',
  aktif          boolean NOT NULL DEFAULT true,
  dibuat_pada    timestamptz NOT NULL DEFAULT now(),
  login_terakhir timestamptz
);

-- ---------- BIDANG TANAH ----------
CREATE TABLE IF NOT EXISTS bidang (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode               text UNIQUE NOT NULL,              -- BJN-0001
  geom               geometry(MultiPolygon,4326) NOT NULL,
  desa               text,
  kecamatan          text,
  kabupaten          text DEFAULT 'Bojonegoro',
  luas_m2            numeric(12,2),                     -- luas hasil ukur
  luas_terdampak_m2  numeric(12,2),                     -- bagian yang masuk ROW
  penggunaan         text,
  alas_hak           text,
  nib                text,
  njop_m2            numeric(14,2),
  batas_utara        text,
  batas_selatan      text,
  batas_timur        text,
  batas_barat        text,
  status             status_bidang NOT NULL DEFAULT 'draft',
  catatan_supervisor text,
  petugas_id         uuid REFERENCES pengguna(id),
  tanggal_ukur       date,
  dibuat_pada        timestamptz NOT NULL DEFAULT now(),
  diubah_pada        timestamptz NOT NULL DEFAULT now(),
  dikirim_pada       timestamptz,
  diverifikasi_pada  timestamptz,
  diverifikasi_oleh  uuid REFERENCES pengguna(id)
);

CREATE INDEX IF NOT EXISTS idx_bidang_geom   ON bidang USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_bidang_status ON bidang (status);
CREATE INDEX IF NOT EXISTS idx_bidang_desa   ON bidang (desa);

-- ---------- PEMILIK ----------
CREATE TABLE IF NOT EXISTS pemilik (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang_id uuid NOT NULL REFERENCES bidang(id) ON DELETE CASCADE,
  urutan    smallint NOT NULL DEFAULT 1,
  nama      text NOT NULL,
  nik       text,
  alamat    text,
  telepon   text,
  pekerjaan text,
  hubungan  text DEFAULT 'Pemilik langsung',            -- ahli waris / kuasa / dst
  npwp      text,
  bank_nama text,
  bank_rek  text
);
CREATE INDEX IF NOT EXISTS idx_pemilik_bidang ON pemilik (bidang_id);
CREATE INDEX IF NOT EXISTS idx_pemilik_nama   ON pemilik USING GIN (to_tsvector('simple', nama));

-- ---------- BANGUNAN ----------
CREATE TABLE IF NOT EXISTS bangunan (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang_id         uuid NOT NULL REFERENCES bidang(id) ON DELETE CASCADE,
  jenis             text,
  konstruksi        text,
  luas_lantai_m2    numeric(10,2),
  jumlah_lantai     smallint,
  atap              text,
  dinding           text,
  lantai_bahan      text,
  tahun_dibangun    smallint,
  kondisi           text,
  tingkat_terdampak text,
  listrik           text,
  air               text,
  sanitasi          text
);
CREATE INDEX IF NOT EXISTS idx_bangunan_bidang ON bangunan (bidang_id);

-- ---------- TANAMAN & BENDA LAIN ----------
CREATE TABLE IF NOT EXISTS tanaman (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang_id  uuid NOT NULL REFERENCES bidang(id) ON DELETE CASCADE,
  jenis      text NOT NULL,
  jumlah     integer,
  satuan     text DEFAULT 'batang',
  keterangan text
);
CREATE INDEX IF NOT EXISTS idx_tanaman_bidang ON tanaman (bidang_id);

CREATE TABLE IF NOT EXISTS benda_lain (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang_id  uuid NOT NULL REFERENCES bidang(id) ON DELETE CASCADE,
  jenis      text NOT NULL,                             -- pagar, sumur, MCK, saluran
  ukuran     text,
  jumlah     integer,
  keterangan text
);
CREATE INDEX IF NOT EXISTS idx_benda_bidang ON benda_lain (bidang_id);

-- ---------- LAMPIRAN ----------
CREATE TABLE IF NOT EXISTS lampiran (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang_id     uuid NOT NULL REFERENCES bidang(id) ON DELETE CASCADE,
  kategori      kategori_lampiran NOT NULL,
  object_key    text NOT NULL UNIQUE,                   -- kunci objek di R2
  nama_asli     text,
  mime          text,
  ukuran_byte   bigint,
  lat           double precision,                       -- dari EXIF
  lon           double precision,
  diambil_pada  timestamptz,                            -- dari EXIF
  sensitif      boolean NOT NULL DEFAULT false,
  diunggah_oleh uuid REFERENCES pengguna(id),
  diunggah_pada timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lampiran_bidang ON lampiran (bidang_id, kategori);

CREATE OR REPLACE FUNCTION tandai_sensitif() RETURNS trigger AS $$
BEGIN
  NEW.sensitif := NEW.kategori IN ('dok_ktp','dok_kk','dok_sertipikat','dok_sppt',
                                   'dok_ahli_waris','dok_kuasa','dok_rekening');
  RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_lampiran_sensitif ON lampiran;
CREATE TRIGGER trg_lampiran_sensitif BEFORE INSERT OR UPDATE ON lampiran
  FOR EACH ROW EXECUTE FUNCTION tandai_sensitif();

-- ---------- LAYER REFERENSI ----------
-- Layer statis ringan (tutupan lahan, utilitas, AOI). Kontur TIDAK di sini —
-- terlalu berat untuk GeoJSON, disajikan sebagai PMTiles. Lihat scripts/tiling.md
CREATE TABLE IF NOT EXISTS layer_geom (
  id    bigserial PRIMARY KEY,
  layer text NOT NULL,                                  -- sawah, hutan, sutet, pipa_exxon, ...
  nama  text,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  geom  geometry(Geometry,4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_layer_geom ON layer_geom USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_layer_nama ON layer_geom (layer);

-- ---------- AUDIT LOG ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial PRIMARY KEY,
  tabel       text NOT NULL,
  record_id   uuid NOT NULL,
  bidang_id   uuid,
  aksi        text NOT NULL,                            -- insert / update / status
  kolom       text,
  nilai_lama  text,
  nilai_baru  text,
  pengguna_id uuid REFERENCES pengguna(id),
  pada        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_bidang ON audit_log (bidang_id, pada DESC);

-- Trigger audit generik. app.pengguna_id di-set per transaksi oleh src/lib/db.ts
CREATE OR REPLACE FUNCTION catat_audit() RETURNS trigger AS $$
DECLARE k text; lama text; baru text; uid uuid; bid uuid;
BEGIN
  BEGIN uid := NULLIF(current_setting('app.pengguna_id', true),'')::uuid;
  EXCEPTION WHEN others THEN uid := NULL; END;

  bid := CASE WHEN TG_TABLE_NAME = 'bidang' THEN NEW.id ELSE NEW.bidang_id END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(tabel,record_id,bidang_id,aksi,pengguna_id)
    VALUES (TG_TABLE_NAME, NEW.id, bid, 'insert', uid);
    RETURN NEW;
  END IF;

  FOR k IN SELECT column_name FROM information_schema.columns
           WHERE table_name = TG_TABLE_NAME AND table_schema = 'public'
             AND column_name NOT IN ('diubah_pada','geom')
  LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', k, k) INTO lama, baru USING OLD, NEW;
    IF lama IS DISTINCT FROM baru THEN
      INSERT INTO audit_log(tabel,record_id,bidang_id,aksi,kolom,nilai_lama,nilai_baru,pengguna_id)
      VALUES (TG_TABLE_NAME, NEW.id, bid,
              CASE WHEN k = 'status' THEN 'status' ELSE 'update' END,
              k, lama, baru, uid);
    END IF;
  END LOOP;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_bidang ON bidang;
CREATE TRIGGER trg_audit_bidang AFTER INSERT OR UPDATE ON bidang
  FOR EACH ROW EXECUTE FUNCTION catat_audit();
DROP TRIGGER IF EXISTS trg_audit_pemilik ON pemilik;
CREATE TRIGGER trg_audit_pemilik AFTER INSERT OR UPDATE ON pemilik
  FOR EACH ROW EXECUTE FUNCTION catat_audit();
DROP TRIGGER IF EXISTS trg_audit_bangunan ON bangunan;
CREATE TRIGGER trg_audit_bangunan AFTER INSERT OR UPDATE ON bangunan
  FOR EACH ROW EXECUTE FUNCTION catat_audit();

CREATE OR REPLACE FUNCTION sentuh() RETURNS trigger AS $$
BEGIN NEW.diubah_pada := now(); RETURN NEW; END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_sentuh_bidang ON bidang;
CREATE TRIGGER trg_sentuh_bidang BEFORE UPDATE ON bidang
  FOR EACH ROW EXECUTE FUNCTION sentuh();

-- ---------- VIEW ----------
-- Payload peta: hanya yang dibutuhkan untuk menggambar & mewarnai bidang
CREATE OR REPLACE VIEW v_bidang_peta AS
SELECT b.id, b.kode, b.status, b.penggunaan, b.desa,
       b.luas_m2, b.luas_terdampak_m2,
       (SELECT p.nama FROM pemilik p WHERE p.bidang_id = b.id ORDER BY p.urutan LIMIT 1) AS pemilik,
       b.geom
FROM bidang b;

-- Kelengkapan berkas per bidang
CREATE OR REPLACE VIEW v_kelengkapan AS
SELECT b.id AS bidang_id,
       count(l.id) FILTER (WHERE l.kategori::text LIKE 'foto_%') AS jml_foto,
       count(l.id) FILTER (WHERE l.kategori::text LIKE 'dok_%')  AS jml_dokumen,
       LEAST(100,(count(DISTINCT l.kategori) FILTER (WHERE l.kategori IN
          ('foto_bidang','foto_patok','foto_pemilik_petugas','dok_ktp','dok_berita_acara'))::float
        / 5.0 * 100)::int) AS persen_wajib
FROM bidang b LEFT JOIN lampiran l ON l.bidang_id = b.id
GROUP BY b.id;
