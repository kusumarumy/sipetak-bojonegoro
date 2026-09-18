"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  KATEGORI_LABEL,
  WAJIB,
  type Bidang,
  type KategoriLampiran,
  type Peran,
} from "@/types";

import { dapatMelihatDokumenPribadi } from "@/lib/rbac";
import { useApp } from "@/store/useApp";

const FOTO: KategoriLampiran[] = [
  "foto_bidang",
  "foto_patok",
  "foto_bangunan_depan",
  "foto_bangunan_kiri",
  "foto_bangunan_kanan",
  "foto_bangunan_belakang",
  "foto_akses",
  "foto_pemilik_petugas",
];

const DOKUMEN: KategoriLampiran[] = [
  "dok_ktp",
  "dok_kk",
  "dok_sertipikat",
  "dok_sppt",
  "dok_ahli_waris",
  "dok_kuasa",
  "dok_rekening",
  "dok_berita_acara",
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
  const { muatUlangKartu, beriPesan } =
    useApp();

  const [sedang, setSedang] =
    useState<string | null>(null);

  const bolehPribadi =
    dapatMelihatDokumenPribadi(peran);

  const perKategori = useMemo(() => {
    const map = new Map<
      string,
      Bidang["lampiran"][number]
    >();

    for (const lampiran of bidang.lampiran) {
      map.set(lampiran.kategori, lampiran);
    }

    return map;
  }, [bidang.lampiran]);

  const wajibAda =
    WAJIB.filter((k) =>
      perKategori.has(k)
    ).length;

  const totalWajib = WAJIB.length;

  const persenWajib =
    totalWajib > 0
      ? Math.round(
          (wajibAda / totalWajib) * 100
        )
      : 0;

  async function unggah(kategori: KategoriLampiran, file: File) {
  setSedang(kategori);
  try {
    const exif = await bacaExif(file);

    // Upload lewat API route sendiri (bebas CORS) → dapat object_key
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bidang_id", String(bidang.id));
    fd.append("kategori", kategori);
    fd.append("nama_asli", file.name);

    const naik = await fetch("/api/lampiran/unggah", {
      method: "POST",
      body: fd,
    });

    if (!naik.ok) {
      throw new Error(await naik.text());
    }

    const { object_key } = await naik.json();

    // Simpan metadata seperti biasa (tidak berubah)
    const simpan = await fetch("/api/lampiran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bidang_id: bidang.id,
        kategori,
        object_key,
        nama_asli: file.name,
        mime: file.type,
        ukuran_byte: file.size,
        ...exif,
      }),
    });

    if (!simpan.ok) {
      throw new Error(await simpan.text());
    }

    await muatUlangKartu();
    beriPesan(`${KATEGORI_LABEL[kategori]} berhasil diunggah.`);
  } catch (error) {
    console.error("UPLOAD BERKAS:", error);
    beriPesan(
      error instanceof Error ? error.message : "Berkas gagal diunggah."
    );
  } finally {
    setSedang(null);
  }
}

  const kurang = WAJIB.filter(
    (k) => !perKategori.has(k)
  );

  return (
    <div className="kb-upload">
      {/* ===================================================
          HEADER KELENGKAPAN
          =================================================== */}

      <div className="kb-upload-summary">
        <div className="kb-upload-summary-main">
          <div className="kb-upload-summary-icon">
            ▧
          </div>

          <div>
            <strong>
              Kelengkapan berkas
            </strong>

            <span>
              {wajibAda} dari {totalWajib}{" "}
              berkas wajib tersedia
            </span>
          </div>
        </div>

        <div className="kb-upload-percent">
          {persenWajib}%
        </div>

        <div className="kb-upload-progress">
          <i
            style={{
              width: `${persenWajib}%`,
            }}
          />
        </div>
      </div>

      {/* ===================================================
          FOTO
          =================================================== */}

      <div className="kb-upload-section">
        <div className="kb-upload-section-head">
          <div>
            <span className="kb-upload-kicker">
              Dokumentasi
            </span>

            <h4>
              Foto lapangan
            </h4>

            <p>
              Dokumentasikan kondisi bidang
              dan objek di lapangan.
            </p>
          </div>

          <span className="kb-upload-count">
            {FOTO.filter((k) =>
              perKategori.has(k)
            ).length}
            /{FOTO.length}
          </span>
        </div>

        <div className="kb-photo-grid">
          {FOTO.map((kategori) => (
            <KartuFoto
              key={kategori}
              kategori={kategori}
              lampiran={perKategori.get(
                kategori
              )}
              wajib={WAJIB.includes(
                kategori
              )}
              bolehEdit={bolehEdit}
              bolehPribadi={bolehPribadi}
              sedang={
                sedang === kategori
              }
              onPilih={(file) =>
                unggah(
                  kategori,
                  file
                )
              }
            />
          ))}
        </div>
      </div>

      {/* ===================================================
          DOKUMEN
          =================================================== */}

      <div className="kb-upload-section">
        <div className="kb-upload-section-head">
          <div>
            <span className="kb-upload-kicker">
              Administrasi
            </span>

            <h4>
              Dokumen pendukung
            </h4>

            <p>
              Berkas kepemilikan dan dokumen
              pendataan bidang.
            </p>
          </div>

          <span className="kb-upload-count">
            {DOKUMEN.filter((k) =>
              perKategori.has(k)
            ).length}
            /{DOKUMEN.length}
          </span>
        </div>

        <div className="kb-document-list">
          {DOKUMEN.map((kategori) => (
            <KartuDokumen
              key={kategori}
              kategori={kategori}
              lampiran={perKategori.get(
                kategori
              )}
              wajib={WAJIB.includes(
                kategori
              )}
              bolehEdit={bolehEdit}
              bolehPribadi={bolehPribadi}
              sedang={
                sedang === kategori
              }
              onPilih={(file) =>
                unggah(
                  kategori,
                  file
                )
              }
            />
          ))}
        </div>
      </div>

      {/* ===================================================
          BERKAS WAJIB
          =================================================== */}

      {kurang.length > 0 && (
        <div className="kb-upload-warning">
          <div className="kb-upload-warning-icon">
            !
          </div>

          <div>
            <strong>
              Berkas wajib belum lengkap
            </strong>

            <span>
              {kurang
                .map(
                  (kategori) =>
                    KATEGORI_LABEL[
                      kategori
                    ]
                )
                .join(", ")}
            </span>

            <small>
              Bidang belum dapat dikirim
              untuk verifikasi sampai
              seluruh berkas wajib tersedia.
            </small>
          </div>
        </div>
      )}

      {/* ===================================================
          KEAMANAN
          =================================================== */}

      <div className="kb-upload-security">
        <span className="kb-upload-security-icon">
          ◉
        </span>

        <div>
          <strong>
            Dokumen terlindungi
          </strong>

          <span>
            Foto dapat menyimpan koordinat
            dan waktu pengambilan. File
            diakses melalui tautan sementara,
            bukan URL publik.
          </span>
        </div>
      </div>
    </div>
  );
}

function KartuFoto({
  kategori,
  lampiran,
  wajib,
  bolehEdit,
  bolehPribadi,
  sedang,
  onPilih,
}: {
  kategori: KategoriLampiran;
  lampiran?: Bidang["lampiran"][number];
  wajib: boolean;
  bolehEdit: boolean;
  bolehPribadi: boolean;
  sedang: boolean;
  onPilih: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const terkunci =
    !!lampiran?.sensitif &&
    !bolehPribadi;

const ada = !!lampiran;

console.log("DATA KARTU FOTO:", {
  kategori,
  ada,
  lampiran,
  lampiranId: lampiran?.id,
});

const dapatUnggah =
  bolehEdit &&
  !ada &&
  !sedang &&
  !terkunci;

useEffect(() => {
  let batal = false;

  async function muatPreview() {
    if (!lampiran?.id || terkunci) {
      setSrc(null);
      setPreviewLoading(false);
      return;
    }

    console.log("MEMUAT PREVIEW:", {
      id: lampiran.id,
      kategori,
    });

    setPreviewLoading(true);

    try {
      const response = await fetch(
        `/api/lampiran/${lampiran.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("RESPONS PREVIEW:", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Gagal memuat preview"
        );
      }

      if (!data?.url) {
        throw new Error(
          "URL preview tidak dikembalikan API"
        );
      }

      if (!batal) {
        setSrc(data.url);
      }
    } catch (error) {
      console.error(
        "PREVIEW LAMPIRAN ERROR:",
        error
      );

      if (!batal) {
        setSrc(null);
      }
    } finally {
      if (!batal) {
        setPreviewLoading(false);
      }
    }
  }

  muatPreview();

  return () => {
    batal = true;
  };
}, [
  lampiran?.id,
  kategori,
  terkunci,
]);
  const metadata =
    lampiran?.lat != null &&
    lampiran?.lon != null
      ? `${lampiran.lat.toFixed(5)}, ${lampiran.lon.toFixed(5)}`
      : null;

  function bukaUpload() {
    if (dapatUnggah) {
      input.current?.click();
    }
  }

  function bukaPreview() {
    if (src && !terkunci) {
      setPreviewOpen(true);
    }
  }

  return (
    <>
      <div
        className={[
          "kb-photo-card",
          ada ? "is-uploaded" : "is-empty",
          sedang ? "is-loading" : "",
          terkunci ? "is-locked" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* =================================================
            AREA FOTO
        ================================================== */}

        <div
          className={[
            "kb-photo-main",
            ada ? "is-previewable" : "",
            dapatUnggah ? "is-upload-target" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role={ada && src ? "button" : undefined}
          tabIndex={ada && src ? 0 : undefined}
          onClick={() => {
            if (ada && src) {
              bukaPreview();
            } else if (!ada) {
              bukaUpload();
            }
          }}
          onKeyDown={(event) => {
            if (
              (event.key === "Enter" ||
                event.key === " ") &&
              ada &&
              src
            ) {
              event.preventDefault();
              bukaPreview();
            }
          }}
        >
          <div className="kb-photo-preview">
            {src ? (
              <>
<img
  src={src}
  alt={KATEGORI_LABEL[kategori]}
  className="kb-photo-image"
  onLoad={() => {
    console.log(
      "GAMBAR PREVIEW BERHASIL DIMUAT:",
      kategori
    );
  }}
  onError={(event) => {
    console.error(
      "GAMBAR PREVIEW GAGAL DIMUAT:",
      kategori,
      src,
      event
    );
  }}
/>
                <div className="kb-photo-preview-overlay">
                  <span>⌕</span>
                  <small>Lihat foto</small>
                </div>
              </>
            ) : (
              <div className="kb-photo-placeholder">
                <span>
                  {sedang
                    ? "…"
                    : previewLoading
                      ? "…"
                      : ada
                        ? "▧"
                        : "+"}
                </span>

                {!ada && (
                  <small>
                    {bolehEdit
                      ? "Unggah foto"
                      : "Belum tersedia"}
                  </small>
                )}
              </div>
            )}

            {wajib && (
              <span
                className={
                  ada
                    ? "kb-badge-success"
                    : "kb-badge-required"
                }
              >
                {ada
                  ? "✓ Tersimpan"
                  : "Wajib"}
              </span>
            )}

            {!wajib && ada && (
              <span className="kb-badge-success">
                ✓ Tersimpan
              </span>
            )}
          </div>

          <div className="kb-photo-info">
            <strong>
              {KATEGORI_LABEL[kategori]}
            </strong>

            <span>
              {sedang
                ? "Mengunggah..."
                : ada
                  ? src
                    ? "Klik untuk melihat foto"
                    : "Dokumentasi tersedia"
                  : bolehEdit
                    ? "Klik untuk unggah"
                    : "Belum tersedia"}
            </span>
          </div>
        </div>

        {/* =================================================
            META DATA
        ================================================== */}

        {ada && !terkunci && (
          <div className="kb-file-meta">
            {metadata && (
              <span>
                ◉ {metadata}
              </span>
            )}

            {lampiran?.diambil_pada && (
              <span>
                ◷{" "}
                {new Date(
                  lampiran.diambil_pada
                ).toLocaleDateString(
                  "id-ID",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </span>
            )}
          </div>
        )}

        {terkunci && (
          <div className="kb-locked-note">
            Dokumen pribadi
            <br />
            tidak tersedia untuk peran ini.
          </div>
        )}

        {/* =================================================
            INPUT UPLOAD
        ================================================== */}

        <input
          ref={input}
          type="file"
          hidden
          accept="image/*"
          onChange={(event) => {
            const file =
              event.target.files?.[0];

            if (file) {
              onPilih(file);
            }

            event.target.value = "";
          }}
        />

        {/* =================================================
            TOMBOL GANTI FOTO
        ================================================== */}

        {ada && bolehEdit && !terkunci && (
          <button
            type="button"
            className="kb-photo-change"
            onClick={() => input.current?.click()}
            disabled={sedang}
          >
            {sedang
              ? "Mengunggah..."
              : "Ganti foto"}
          </button>
        )}
      </div>

{previewOpen && previewUrl && (
  <div className="kb-preview-backdrop">
    <div
      className="kb-preview-dialog"
      role="dialog"
      aria-modal="false"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div className="kb-preview-header">
        <strong className="kb-preview-title">
          {lampiran?.nama_asli ??
            "Preview dokumen"}
        </strong>

        <button
          type="button"
          className="kb-preview-close"
          onClick={tutupPreview}
          aria-label="Tutup preview"
        >
          ×
        </button>
      </div>

      <div className="kb-preview-content">
        {adalahPdf ? (
          <iframe
            src={previewUrl}
            title={
              lampiran?.nama_asli ??
              "Preview PDF"
            }
          />
        ) : (
          <img
            src={previewUrl}
            alt={
              lampiran?.nama_asli ??
              "Preview dokumen"
            }
          />
        )}
      </div>
    </div>
  </div>
)}
    </>
  );
}
function KartuDokumen({
  kategori,
  lampiran,
  wajib,
  bolehEdit,
  bolehPribadi,
  sedang,
  onPilih,
}: {
  kategori: KategoriLampiran;
  lampiran?: Bidang["lampiran"][number];
  wajib: boolean;
  bolehEdit: boolean;
  bolehPribadi: boolean;
  sedang: boolean;
  onPilih: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const terkunci =
    !!lampiran?.sensitif &&
    !bolehPribadi;

  const ada = !!lampiran;

  /*
   * Dokumen yang sudah ada tetap boleh diganti
   */
  const dapatUnggah =
    bolehEdit &&
    !sedang &&
    !terkunci;

  const adalahPdf =
    lampiran?.mime === "application/pdf" ||
    lampiran?.nama_asli
      ?.toLowerCase()
      .endsWith(".pdf");

  /*
   * Ambil signed URL dari R2
   */
  const bukaPreview = async () => {
    if (!lampiran?.id || terkunci) return;

    setPreviewLoading(true);

    try {
      const response = await fetch(
        `/api/lampiran/${lampiran.id}`
      );

      if (!response.ok) {
        throw new Error(
          "Dokumen tidak dapat dibuka"
        );
      }

      const data = await response.json();

      if (!data?.url) {
        throw new Error(
          "URL dokumen tidak tersedia"
        );
      }

      setPreviewUrl(data.url);
      setPreviewOpen(true);
    } catch (error) {
      console.error(
        "Gagal membuka preview dokumen:",
        error
      );

      alert(
        "Dokumen tidak dapat dibuka."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const tutupPreview = () => {
    setPreviewOpen(false);
  };

  return (
    <>
      <div
        className={[
          "kb-document-card",
          ada
            ? "is-uploaded"
            : "is-empty",
          terkunci
            ? "is-locked"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* ICON */}
        <div className="kb-document-icon">
          {kategori === "dok_ktp"
            ? "ID"
            : kategori === "dok_kk"
              ? "KK"
              : "DOC"}
        </div>

        {/* INFORMASI */}
        <div className="kb-document-info">
          <div className="kb-document-title">
            <strong>
              {KATEGORI_LABEL[kategori]}
            </strong>

            {wajib && (
              <span
                className={
                  ada
                    ? "kb-status-mini success"
                    : "kb-status-mini required"
                }
              >
                {ada
                  ? "Lengkap"
                  : "Wajib"}
              </span>
            )}
          </div>

          <span className="kb-document-file">
            {terkunci
              ? "Dokumen pribadi tidak tersedia"
              : sedang
                ? "Mengunggah..."
                : lampiran?.nama_asli ??
                  (bolehEdit
                    ? "Belum diunggah"
                    : "Belum tersedia")}
          </span>

          {lampiran && !terkunci && (
            <small>
              {formatFileSize(
                lampiran.ukuran_byte
              )}

              {lampiran.diunggah_pada
                ? ` • ${new Date(
                    lampiran.diunggah_pada
                  ).toLocaleDateString(
                    "id-ID"
                  )}`
                : ""}
            </small>
          )}
        </div>

        {/* ACTION */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
          }}
        >
          {/* PREVIEW */}
          {ada && !terkunci && (
            <button
              type="button"
              className="kb-document-action"
              disabled={previewLoading}
              onClick={bukaPreview}
            >
              {previewLoading
                ? "..."
                : "Lihat"}
            </button>
          )}

          {/* UPLOAD / GANTI */}
          {dapatUnggah && (
            <button
              type="button"
              className={
                ada
                  ? "kb-document-action"
                  : "kb-document-action"
              }
              disabled={sedang}
              onClick={() =>
                input.current?.click()
              }
            >
              {sedang
                ? "Mengunggah..."
                : ada
                  ? "Ganti"
                  : "+ Unggah"}
            </button>
          )}

          {/* STATUS JIKA TIDAK BOLEH EDIT */}
          {!dapatUnggah && ada && !bolehEdit && (
            <span
              className="kb-document-action done"
            >
              ✓ Tersimpan
            </span>
          )}
        </div>

        {/* FILE INPUT */}
        <input
          ref={input}
          type="file"
          hidden
          accept="image/*,application/pdf"
          onChange={(event) => {
            const file =
              event.target.files?.[0];

            if (file) {
              onPilih(file);
            }

            event.target.value = "";
          }}
        />
      </div>

      {/* PREVIEW MODAL */}
      {previewOpen && previewUrl && (
        <div
          onClick={tutupPreview}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "rgba(0,0,0,.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "min(900px, 94vw)",
              height: "min(760px, 90vh)",
              background: "#fff",
              borderRadius: "14px",
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                height: "52px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                padding: "0 16px",
                borderBottom:
                  "1px solid #e5e7eb",
              }}
            >
              <strong
                style={{
                  fontSize: "14px",
                  color: "#1f2937",
                }}
              >
                {lampiran?.nama_asli}
              </strong>

              <button
                type="button"
                onClick={tutupPreview}
                style={{
                  border: 0,
                  background: "#f3f4f6",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>

            {/* CONTENT */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {adalahPdf ? (
                <iframe
                  src={previewUrl}
                  title={
                    lampiran?.nama_asli ??
                    "Preview dokumen"
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                  }}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={
                    lampiran?.nama_asli ??
                    "Preview dokumen"
                  }
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function formatFileSize(
  value: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "Ukuran tidak diketahui";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(
      value / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    value /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

/* =========================================================
   BACA EXIF
   ========================================================= */

async function bacaExif(
  file: File
): Promise<{
  lat?: number;
  lon?: number;
  diambil_pada?: string;
}> {
  if (!file.type.startsWith("image/")) {
    return {};
  }

  try {
    const buf =
      await file
        .slice(
          0,
          128 * 1024
        )
        .arrayBuffer();

    const v = new DataView(buf);

    if (
      v.getUint16(0) !== 0xffd8
    ) {
      return {};
    }

    let off = 2;

    while (
      off <
      v.byteLength - 4
    ) {
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
        let waktu = "";

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

          if (
            tag === 0x8825
          ) {
            gpsOff =
              tiff +
              u32(e + 8);
          }

          if (
            tag === 0x8769
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

        if (waktu) {
          const [d, t] =
            waktu.split(" ");

          if (d && t) {
            hasil.diambil_pada =
              new Date(
                `${d.replace(
                  /:/g,
                  "-"
                )}T${t}`
              ).toISOString();
          }
        }

        if (gpsOff) {
          let lat = 0;
          let lon = 0;

          let nS = "N";
          let eW = "E";

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

            if (tag === 1) {
              nS =
                String.fromCharCode(
                  v.getUint8(
                    e + 8
                  )
                );
            }

            if (tag === 2) {
              lat =
                dms(
                  tiff +
                    u32(
                      e + 8
                    )
                );
            }

            if (tag === 3) {
              eW =
                String.fromCharCode(
                  v.getUint8(
                    e + 8
                  )
                );
            }

            if (tag === 4) {
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
              nS === "S"
                ? -lat
                : lat;

            hasil.lon =
              eW === "W"
                ? -lon
                : lon;
          }
        }

        return hasil;
      }

      off +=
        2 +
        v.getUint16(
          off + 2
        );
    }
  } catch {
    // Foto tanpa EXIF tetap boleh diunggah.
  }

  return {};
}
