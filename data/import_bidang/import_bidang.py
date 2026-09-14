import traceback
import os
import json
import psycopg2
from psycopg2.extras import execute_values

GEOJSON_FILE = r"..\bidang_tanah.geojson"
BATCH_SIZE = 100

def load_env():
    env_file = ".env"

    if not os.path.exists(env_file):
        raise Exception(".env tidak ditemukan")

    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if not line or line.startswith("#"):
                continue

            if "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip().strip('"').strip("'")

load_env()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL tidak ditemukan di .env")

print("=" * 60)
print("IMPORT BIDANG TANAH KE SUPABASE")
print("=" * 60)

print("\nMembaca GeoJSON...")

with open(GEOJSON_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

features = data["features"]

print(f"Jumlah feature : {len(features)}")

crs = (
    data.get("crs", {})
    .get("properties", {})
    .get("name", "")
)

print(f"CRS            : {crs}")

print("\nMenghubungkan ke Supabase...")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = False

print("Koneksi berhasil.")

columns = [
    "objectid",
    "bidang_id",
    "kodewilaya",
    "kecamatan",
    "kelurahan",
    "tipehak",
    "tipeproduk",
    "tahun",
    "nib",
    "luastertul",
    "luaspeta",
    "sumbergeom",
    "alatukur",
    "penggunaan",
    "metodukur",
    "shape_leng",
    "shape_area",
    "hub_tnh",
    "kode_wwc",
    "jenis_tnh",
    "kode_bid",
    "rt_rw",
    "nama_milik",
    "ttl_milik",
    "krja_milik",
    "almt_milik",
    "nik_milik",
    "nama_sewa",
    "ttl_sewa",
    "krja_sewa",
    "almt_sewa",
    "nik_sewa",
    "nomor_hp",
    "sta_tnh",
    "surat_hak",
    "nomor_hak",
    "luas_tnh",
    "ruang_atbt",
    "luas_atbt",
    "jenis_tnm",
    "jumlah_tnm",
    "jenis_bnd",
    "jumlah_bnd",
    "beban_hak",
    "dampak_tnh",
    "jml_bgn",
    "date_updt",
    "foto_tnh",
    "fid",
    "nama",
    "layer",
    "path",
    "geometry",
]

sql = """
INSERT INTO public.bidang_tanah (
    objectid,
    bidang_id,
    kodewilaya,
    kecamatan,
    kelurahan,
    tipehak,
    tipeproduk,
    tahun,
    nib,
    luastertul,
    luaspeta,
    sumbergeom,
    alatukur,
    penggunaan,
    metodukur,
    shape_leng,
    shape_area,
    hub_tnh,
    kode_wwc,
    jenis_tnh,
    kode_bid,
    rt_rw,
    nama_milik,
    ttl_milik,
    krja_milik,
    almt_milik,
    nik_milik,
    nama_sewa,
    ttl_sewa,
    krja_sewa,
    almt_sewa,
    nik_sewa,
    nomor_hp,
    sta_tnh,
    surat_hak,
    nomor_hak,
    luas_tnh,
    ruang_atbt,
    luas_atbt,
    jenis_tnm,
    jumlah_tnm,
    jenis_bnd,
    jumlah_bnd,
    beban_hak,
    dampak_tnh,
    jml_bgn,
    date_updt,
    foto_tnh,
    fid,
    nama,
    layer,
    path,
    geometry
)
VALUES %s
"""

def val(props, key):
    value = props.get(key)
    return None if value == "" else value

def integer(props, key):
    value = val(props, key)

    if value is None:
        return None

    return int(float(value))

def number(props, key):
    value = val(props, key)

    if value is None:
        return None

    return float(value)

def make_row(feature):
    p = feature.get("properties", {})
    geometry = feature.get("geometry")

    if geometry is None:
        raise Exception("Geometry kosong")

    return (
        integer(p, "OBJECTID"),
        val(p, "ID"),
        val(p, "KODEWILAYA"),
        val(p, "KECAMATAN"),
        val(p, "KELURAHAN"),
        val(p, "TIPEHAK"),
        val(p, "TIPEPRODUK"),
        integer(p, "TAHUN"),
        val(p, "NIB"),
        number(p, "LUASTERTUL"),
        number(p, "LUASPETA"),
        number(p, "SUMBERGEOM"),
        val(p, "ALATUKUR"),
        val(p, "PENGGUNAAN"),
        val(p, "METODUKUR"),
        number(p, "SHAPE_Leng"),
        number(p, "SHAPE_Area"),
        val(p, "HUB_TNH"),
        val(p, "KODE_WWC"),
        val(p, "JENIS_TNH"),
        val(p, "KODE_BID"),
        val(p, "RT_RW"),
        val(p, "NAMA_MILIK"),
        val(p, "TTL_MILIK"),
        val(p, "KRJA_MILIK"),
        val(p, "ALMT_MILIK"),
        val(p, "NIK_MILIK"),
        val(p, "NAMA_SEWA"),
        val(p, "TTL_SEWA"),
        val(p, "KRJA_SEWA"),
        val(p, "ALMT_SEWA"),
        val(p, "NIK_SEWA"),
        val(p, "NOMOR_HP"),
        val(p, "STA_TNH"),
        val(p, "SURAT_HAK"),
        val(p, "NOMOR_HAK"),
        number(p, "LUAS_TNH"),
        val(p, "RUANG_ATBT"),
        number(p, "LUAS_ATBT"),
        val(p, "JENIS_TNM"),
        number(p, "JUMLAH_TNM"),
        val(p, "JENIS_BND"),
        number(p, "JUMLAH_BND"),
        val(p, "BEBAN_HAK"),
        val(p, "DAMPAK_TNH"),
        number(p, "JML_BGN"),
        val(p, "DATE_UPDT"),
        val(p, "FOTO_TNH"),
        val(p, "FID"),
        val(p, "NAMA"),
        val(p, "layer"),
        val(p, "path"),
        json.dumps(geometry, separators=(",", ":")),
    )

print("\nMulai import...")
print("EPSG:32749 -> EPSG:4326\n")

try:
    for start in range(0, len(features), BATCH_SIZE):

        batch = features[start:start + BATCH_SIZE]

        rows = [make_row(feature) for feature in batch]
        # 52 kolom atribut + 1 geometry = 53 nilai
        attribute_placeholders = ",".join(["%s"] * 52)

        template = (
            "("
            + attribute_placeholders
            + ","
            + "ST_Transform("
            + "ST_SetSRID("
            + "ST_GeomFromGeoJSON(%s),"
            + "32749"
            + "),"
            + "4326"
            + ")"
            + ")"
        )

        print(f"Jumlah nilai per row : {len(rows[0])}")
        print(f"Jumlah placeholder   : {template.count('%s')}")

        with conn.cursor() as cur:
            execute_values(
                cur,
                sql,
                rows,
                template=template,
                page_size=BATCH_SIZE,
            )

        conn.commit()

        done = min(start + BATCH_SIZE, len(features))

        print(
            f"{done}/{len(features)} bidang berhasil diimport"
        )

    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM public.bidang_tanah;"
        )

        total = cur.fetchone()[0]

    print("\n" + "=" * 60)
    print("IMPORT SELESAI")
    print("=" * 60)
    print(f"Total data di database : {total}")
    print("=" * 60)

except Exception as e:
    print("\n\nIMPORT GAGAL!")
    print(e)
    traceback.print_exc()

finally:
    conn.close()