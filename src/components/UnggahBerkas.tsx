'use client';

import { useEffect, useRef, useState } from 'react';

import {
  KATEGORI_LABEL,
  WAJIB,
  type Bidang,
  type KategoriLampiran,
  type Peran,
} from '@/types';

import { dapatMelihatDokumenPribadi } from '@/lib/rbac';
import { useApp } from '@/store/useApp';

/**
 * Urutan foto mengikuti urutan kerja petugas di lapangan.
 *
 * Tanaman dan benda lain sudah dihapus dari sistem.
 */
const FOTO: KategoriLampiran[] = [
  'foto_bidang',
  'foto_patok',
  'foto_bangunan_depan',
  'foto_bangunan_kiri',
  'foto_bangunan_kanan',
  'foto_bangunan_belakang',
  'foto_akses',
  'foto_pemilik_petugas',
];

const DOKUMEN: KategoriLampiran[] = [
  'dok_ktp',
  'dok_kk',
  'dok_sertipikat',
  'dok_sppt',
  'dok_ahli_waris',
  'dok_kuasa',
  'dok_rekening',
  'dok_berita_acara',
];

export default function UnggahBerkas({
  bidang,
  peran,
  bolehEdit,
}: {
  bidang: Bidang;
  peran: Peran;
  bolehEdit: boolean;
}) {
  const { muatUlangKartu, beriPesan } = useApp();

  const [sedang, setSedang] = useState<string | null>(null);

  const bolehPribadi =
    dapatMelihatDokumenPribadi(peran);

  /**
   * Ambil satu lampiran terbaru untuk setiap kategori.
   */
  const perKategori =
    new Map<string, typeof bidang.lampiran[number]>();

  for (const l of bidang.lampiran) {
    if (!perKategori.has(l.kategori)) {
      perKategori.set(l.kategori, l);
    }
  }

  /**
   * Upload berkas:
   * 1. Baca EXIF foto.
   * 2. Minta presigned URL.
   * 3. Upload langsung ke R2.
   * 4. Simpan metadata lampiran ke database.
   * 5. Reload kartu bidang.
   */
  async function unggah(
    kategori: KategoriLampiran,
    file: File
  ) {
    setSedang(kategori);

    try {
      const exif = await bacaExif(file);

      const p = await fetch(
        '/api/lampiran/presign',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bidang_id: bidang.id,
            kategori,
            nama_asli: file.name,
            mime: file.type,
            ukuran_byte: file.size,
          }),
        }
      );

      if (!p.ok) {
        throw new Error(await p.text());
      }

      const {
        url,
        object_key,
      } = await p.json();

      /**
       * Berkas langsung naik ke R2.
       * Tidak melewati server aplikasi.
       */
      const put = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!put.ok) {
        throw new Error(
          'Unggahan ke penyimpanan gagal'
        );
      }

      /**
       * Simpan metadata setelah file berhasil
       * tersimpan di object storage.
       */
      const c = await fetch(
        '/api/lampiran',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            bidang_id: bidang.id,
            kategori,
            object_key,
            nama_asli: file.name,
            mime: file.type,
            ukuran_byte: file.size,
            ...exif,
          }),
        }
      );

      if (!c.ok) {
        throw new Error(await c.text());
      }

      await muatUlangKartu();

      beriPesan(
        `${KATEGORI_LABEL[kategori]} tersimpan.`
      );
    } catch (e: any) {
      beriPesan(
        'Berkas gagal diunggah. ' +
          (e?.message ?? 'Terjadi kesalahan.')
      );
    } finally {
      setSedang(null);
    }
  }

  /**
   * Berkas wajib yang belum tersedia.
   */
  const kurang = WAJIB.filter(
    (k) => !perKategori.has(k)
  );

  return (
    <>
      {/* =====================================================
          FOTO LAPANGAN
          ===================================================== */}

      <div className="k-sub">
        Foto lapangan
      </div>

      <div className="photos">
        {FOTO.map((k) => (
          <Ubin
            key={k}
            kategori={k}
            lampiran={perKategori.get(k)}
            wajib={WAJIB.includes(k)}
            bolehEdit={bolehEdit}
            bolehPribadi={bolehPribadi}
            sedang={sedang === k}
            onPilih={(f) =>
              unggah(k, f)
            }
          />
        ))}
      </div>

      {/* =====================================================
          DOKUMEN
          ===================================================== */}

      <div className="k-sub">
        Dokumen
      </div>

      <div className="photos">
        {DOKUMEN.map((k) => (
          <Ubin
            key={k}
            kategori={k}
            lampiran={perKategori.get(k)}
            wajib={WAJIB.includes(k)}
            bolehEdit={bolehEdit}
            bolehPribadi={bolehPribadi}
            sedang={sedang === k}
            onPilih={(f) =>
              unggah(k, f)
            }
          />
        ))}
      </div>

      {/* =====================================================
          PERINGATAN BERKAS WAJIB
          ===================================================== */}

      {kurang.length > 0 && (
        <p className="hint">
          Berkas wajib yang belum ada:{' '}
          {kurang
            .map(
              (k) =>
                KATEGORI_LABEL[k]
            )
            .join(', ')}
          .
          <br />
          Bidang belum bisa dikirim
          untuk verifikasi sebelum
          semuanya lengkap.
        </p>
      )}

      {/* =====================================================
          INFORMASI KEAMANAN BERKAS
          ===================================================== */}

      <p className="hint">
        Setiap berkas menyimpan
        koordinat, waktu pengambilan,
        dan petugas. Berkas dibuka
        lewat tautan bertanda tangan
        yang kedaluwarsa dalam 5 menit,
        bukan URL publik.
      </p>
    </>
  );
}

function Ubin({
  kategori,
  lampiran,
  wajib,
  bolehEdit,
  bolehPribadi,
  sedang,
  onPilih,
}: {
  kategori: KategoriLampiran;
  lampiran?: Bidang['lampiran'][number];
  wajib: boolean;
  bolehEdit: boolean;
  bolehPribadi: boolean;
  sedang: boolean;
  onPilih: (file: File) => void;
}) {
  const input =
    useRef<HTMLInputElement>(null);

  const [src, setSrc] =
    useState<string | null>(null);

  const terkunci =
    lampiran?.sensitif &&
    !bolehPribadi;

  /**
   * URL file diminta ketika ubin tampil.
   * URL bersifat sementara.
   */
  useEffect(() => {
    let batal = false;

    if (lampiran && !terkunci) {
      fetch(
        `/api/lampiran/${lampiran.id}`
      )
        .then((r) => r.json())
        .then((j) => {
          if (!batal) {
            setSrc(j.url);
          }
        })
        .catch(() => {});
    } else {
      setSrc(null);
    }

    return () => {
      batal = true;
    };
  }, [
    lampiran?.id,
    terkunci,
  ]);

  const ada = !!lampiran;

  const dapatUnggah =
    bolehEdit && !ada && !sedang;

  return (
    <div
      className={
        'ph-tile' +
        (ada ? '' : ' empty')
      }
      onClick={() => {
        if (
          dapatUnggah
        ) {
          input.current?.click();
        }
      }}
      style={{
        cursor: dapatUnggah
          ? 'pointer'
          : 'default',
      }}
    >
      {/* =================================================
          PREVIEW
          ================================================= */}

      {src && (
        <img
          src={src}
          alt={
            KATEGORI_LABEL[
              kategori
            ]
          }
        />
      )}

      {/* =================================================
          DOKUMEN SENSITIF
          ================================================= */}

      {terkunci && (
        <div className="lock">
          Dokumen pribadi
          <br />
          tidak dibuka untuk
          peran ini
        </div>
      )}

      {/* =================================================
          CAP
          ================================================= */}

      <div className="cap">
        <div className="t">
          {KATEGORI_LABEL[kategori]}
          {wajib && !ada
            ? ' *'
            : ''}
        </div>

        <div className="m">
          {sedang ? (
            'Mengunggah…'
          ) : ada ? (
            <>
              {lampiran.lat != null &&
              lampiran.lon != null
                ? `${lampiran.lat.toFixed(
                    5
                  )} / ${lampiran.lon.toFixed(
                    5
                  )}`
                : 'tanpa koordinat'}

              <br />

              {lampiran.diambil_pada
                ? new Date(
                    lampiran.diambil_pada
                  ).toLocaleString(
                    'id-ID'
                  )
                : '—'}
            </>
          ) : bolehEdit ? (
            'ketuk untuk unggah'
          ) : (
            'belum ada'
          )}
        </div>
      </div>

      {/* =================================================
          FILE INPUT
          ================================================= */}

      <input
        ref={input}
        type="file"
        hidden
        accept="image/*,application/pdf"
        onChange={(e) => {
          const f =
            e.target.files?.[0];

          if (f) {
            onPilih(f);
          }

          e.target.value = '';
        }}
      />
    </div>
  );
}

/**
 * Membaca koordinat & waktu dari EXIF
 * secara langsung, tanpa pustaka tambahan.
 *
 * Kalau kelak butuh lebih banyak tag,
 * bisa diganti dengan exifr.
 */
async function bacaExif(
  file: File
): Promise<{
  lat?: number;
  lon?: number;
  diambil_pada?: string;
}> {
  if (
    !file.type.startsWith('image/')
  ) {
    return {};
  }

  try {
    const buf =
      await file
        .slice(0, 128 * 1024)
        .arrayBuffer();

    const v = new DataView(buf);

    /**
     * JPEG SOI.
     */
    if (
      v.getUint16(0) !==
      0xffd8
    ) {
      return {};
    }

    let off = 2;

    while (
      off <
      v.byteLength - 4
    ) {
      /**
       * EXIF APP1.
       */
      if (
        v.getUint16(off) ===
        0xffe1
      ) {
        const tiff =
          off + 10;

        const le =
          v.getUint16(tiff) ===
          0x4949;

        const u16 = (
          p: number
        ) =>
          v.getUint16(
            p,
            le
          );

        const u32 = (
          p: number
        ) =>
          v.getUint32(
            p,
            le
          );

        const rasio = (
          p: number
        ) =>
          u32(p) /
          u32(p + 4);

        const dms = (
          p: number
        ) =>
          rasio(p) +
          rasio(
            p + 8
          ) /
            60 +
          rasio(
            p + 16
          ) /
            3600;

        let ifd =
          tiff +
          u32(
            tiff + 4
          );

        let gpsOff = 0;
        let waktu = '';

        /**
         * Baca IFD utama.
         */
        for (
          let i = 0;
          i < u16(ifd);
          i++
        ) {
          const e =
            ifd +
            2 +
            i * 12;

          const tag =
            u16(e);

          /**
           * GPSInfo.
           */
          if (
            tag ===
            0x8825
          ) {
            gpsOff =
              tiff +
              u32(e + 8);
          }

          /**
           * ExifIFDPointer.
           */
          if (
            tag ===
            0x8769
          ) {
            const ex =
              tiff +
              u32(e + 8);

            for (
              let j = 0;
              j < u16(ex);
              j++
            ) {
              const f =
                ex +
                2 +
                j * 12;

              /**
               * DateTimeOriginal.
               */
              if (
                u16(f) ===
                0x9003
              ) {
                const p =
                  tiff +
                  u32(f + 8);

                waktu =
                  new TextDecoder()
                    .decode(
                      new Uint8Array(
                        buf,
                        p,
                        19
                      )
                    );
              }
            }
          }
        }

        const hasil: {
          lat?: number;
          lon?: number;
          diambil_pada?: string;
        } = {};

        /**
         * Waktu pengambilan.
         */
        if (waktu) {
          const [
            d,
            t,
          ] =
            waktu.split(
              ' '
            );

          if (d && t) {
            hasil.diambil_pada =
              new Date(
                `${d.replace(
                  /:/g,
                  '-'
                )}T${t}`
              ).toISOString();
          }
        }

        /**
         * GPS.
         */
        if (gpsOff) {
          let lat = 0;
          let lon = 0;

          let nS = 'N';
          let eW = 'E';

          for (
            let i = 0;
            i < u16(gpsOff);
            i++
          ) {
            const e =
              gpsOff +
              2 +
              i * 12;

            const tag =
              u16(e);

            /**
             * GPSLatitudeRef.
             */
            if (
              tag === 1
            ) {
              nS =
                String.fromCharCode(
                  v.getUint8(
                    e + 8
                  )
                );
            }

            /**
             * GPSLatitude.
             */
            if (
              tag === 2
            ) {
              lat =
                dms(
                  tiff +
                    u32(
                      e + 8
                    )
                );
            }

            /**
             * GPSLongitudeRef.
             */
            if (
              tag === 3
            ) {
              eW =
                String.fromCharCode(
                  v.getUint8(
                    e + 8
                  )
                );
            }

            /**
             * GPSLongitude.
             */
            if (
              tag === 4
            ) {
              lon =
                dms(
                  tiff +
                    u32(
                      e + 8
                    )
                );
            }
          }

          if (lat) {
            hasil.lat =
              nS === 'S'
                ? -lat
                : lat;

            hasil.lon =
              eW === 'W'
                ? -lon
                : lon;
          }
        }

        return hasil;
      }

      /**
       * Lanjut ke marker JPEG berikutnya.
       */
      off +=
        2 +
        v.getUint16(
          off + 2
        );
    }
  } catch {
    /**
     * Foto tanpa EXIF tetap
     * boleh diunggah.
     */
  }

  return {};
}
