"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  KATEGORI_LABEL,
  WAJIB,
  type Bidang,
  type KategoriLampiran,
  type Peran,
} from "@/types";

import { useApp } from "@/store/useApp";

const FOTO: KategoriLampiran[] = [
  "foto_bidang",
  "foto_bangunan_depan",
  "foto_pemilik_petugas",
];

export default function UnggahBerkas({
  bidang,
  peran: _peran,
  bolehEdit,
}: {
  bidang: Bidang;
  peran: Peran;
  bolehEdit: boolean;
}) {
  const { muatUlangKartu, beriPesan } = useApp();

  const [sedang, setSedang] =
    useState<string | null>(null);

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

  const fotoAda = WAJIB.filter((kategori) =>
    perKategori.has(kategori)
  ).length;

  const totalFoto = WAJIB.length;

  const persenFoto =
    totalFoto > 0
      ? Math.round((fotoAda / totalFoto) * 100)
      : 0;

  async function unggah(
    kategori: KategoriLampiran,
    file: File
  ) {
    setSedang(kategori);

    try {
      const exif = await bacaExif(file);

      /*
       * ==========================================
       * 1. UPLOAD FILE KE R2
       * ==========================================
       *
       * Sekarang menggunakan FID,
       * bukan bidang.id.
       */

      const fd = new FormData();

      fd.append("file", file);

      fd.append(
        "fid",
        String(bidang.fid)
      );

      fd.append(
        "kategori",
        kategori
      );

      fd.append(
        "nama_asli",
        file.name
      );

      const naik = await fetch(
        "/api/lampiran/unggah",
        {
          method: "POST",
          body: fd,
        }
      );

      if (!naik.ok) {
        throw new Error(
          await naik.text()
        );
      }

      const {
        object_key,
      } = await naik.json();

      /*
       * ==========================================
       * 2. SIMPAN METADATA KE DATABASE
       * ==========================================
       *
       * Relasi bidang sekarang menggunakan FID.
       */

      const simpan = await fetch(
        "/api/lampiran",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fid: bidang.fid,
            kategori,
            object_key,
            nama_asli: file.name,
            mime: file.type,
            ukuran_byte: file.size,
            ...exif,
          }),
        }
      );

      if (!simpan.ok) {
        throw new Error(
          await simpan.text()
        );
      }

      /*
       * Reload kartu supaya foto baru
       * langsung muncul.
       */

      await muatUlangKartu();

      beriPesan(
        `${KATEGORI_LABEL[kategori]} berhasil diunggah.`
      );
    } catch (error) {
      console.error(
        "UPLOAD FOTO:",
        error
      );

      beriPesan(
        error instanceof Error
          ? error.message
          : "Foto gagal diunggah."
      );
    } finally {
      setSedang(null);
    }
  }

  const kurang = WAJIB.filter(
    (kategori) =>
      !perKategori.has(kategori)
  );

  return (
    <div className="kb-upload">

      <div className="kb-upload-summary">
        <div className="kb-upload-summary-main">

          <div className="kb-upload-summary-icon">
            ▧
          </div>

          <div>
            <strong>
              Kelengkapan foto
            </strong>

            <span>
              {fotoAda} dari {totalFoto}{" "}
              foto wajib tersedia
            </span>
          </div>
        </div>

        <div className="kb-upload-percent">
          {persenFoto}%
        </div>

        <div className="kb-upload-progress">
          <i
            style={{
              width: `${persenFoto}%`,
            }}
          />
        </div>
      </div>

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
              Unggah foto bidang dan foto pemilik &amp; petugas.
              Foto bangunan bersifat opsional.
            </p>
          </div>

          <span className="kb-upload-count">
            {fotoAda}/{totalFoto}
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
              bolehEdit={bolehEdit}
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

      {kurang.length > 0 && (
        <div className="kb-upload-warning">

          <div className="kb-upload-warning-icon">
            !
          </div>

          <div>
            <strong>
              Foto wajib belum lengkap
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
              seluruh foto wajib tersedia.
            </small>
          </div>

        </div>
      )}

      <div className="kb-upload-security">

        <span className="kb-upload-security-icon">
          ◉
        </span>

        <div>
          <strong>
            Foto terlindungi
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
  bolehEdit,
  sedang,
  onPilih,
}: {
  kategori: KategoriLampiran;
  lampiran?: Bidang["lampiran"][number];
  bolehEdit: boolean;
  sedang: boolean;
  onPilih: (file: File) => void;
}) {
  const input =
    useRef<HTMLInputElement>(null);

  const [src, setSrc] =
    useState<string | null>(null);

  const [previewOpen, setPreviewOpen] =
    useState(false);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const ada = !!lampiran;

  const dapatUnggah =
    bolehEdit &&
    !ada &&
    !sedang;

  useEffect(() => {
    let batal = false;

    async function muatPreview() {
      if (!lampiran?.id) {
        setSrc(null);
        setPreviewLoading(false);
        return;
      }

      setPreviewLoading(true);

      try {
        const response =
          await fetch(
            `/api/lampiran/${lampiran.id}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

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
          "PREVIEW FOTO ERROR:",
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
  }, [lampiran?.id]);

  const metadata =
    lampiran?.lat != null &&
    lampiran?.lon != null
      ? `${lampiran.lat.toFixed(
          5
        )}, ${lampiran.lon.toFixed(
          5
        )}`
      : null;

  function bukaUpload() {
    if (dapatUnggah) {
      input.current?.click();
    }
  }

  function bukaPreview() {
    if (src) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setDragging(false);
      setPreviewOpen(true);
    }
  }

  function tutupPreview() {
    setPreviewOpen(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
  }

  function zoomKe(nilai: number) {
    const next = Math.min(5, Math.max(0.5, nilai));
    setZoom(next);
    if (next <= 1) setPan({ x: 0, y: 0 });
  }

  function resetZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomKe(zoom + (event.deltaY < 0 ? 0.15 : -0.15));
  }

  function mulaiDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setDragStart({
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
    });
  }

  function gerakDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setPan({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  }

  function selesaiDrag() {
    setDragging(false);
  }

  return (
    <>
      <div
        className={[
          "kb-photo-card",
          ada
            ? "is-uploaded"
            : "is-empty",
          sedang
            ? "is-loading"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >

        <div
          className={[
            "kb-photo-main",
            ada
              ? "is-previewable"
              : "",
            dapatUnggah
              ? "is-upload-target"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role={
            ada && src
              ? "button"
              : undefined
          }
          tabIndex={
            ada && src
              ? 0
              : undefined
          }
          onClick={() => {
            if (
              ada &&
              src
            ) {
              bukaPreview();
            } else if (!ada) {
              bukaUpload();
            }
          }}
          onKeyDown={(event) => {
            if (
              (
                event.key ===
                  "Enter" ||
                event.key === " "
              ) &&
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
                  alt={
                    KATEGORI_LABEL[
                      kategori
                    ]
                  }
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

                  <small>
                    Lihat foto
                  </small>
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

            <span
              className={
                ada
                  ? "kb-badge-success"
                  : WAJIB.includes(kategori)
                    ? "kb-badge-required"
                    : "kb-badge-optional"
              }
            >
              {ada
                ? "✓ Tersimpan"
                : WAJIB.includes(kategori)
                  ? "Wajib"
                  : "Opsional"}
            </span>

          </div>

          <div className="kb-photo-info">

            <strong>
              {KATEGORI_LABEL[
                kategori
              ]}
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

        {ada && (
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

        {ada &&
          bolehEdit && (
            <button
              type="button"
              className="kb-photo-change"
              onClick={() =>
                input.current?.click()
              }
              disabled={sedang}
            >
              {sedang
                ? "Mengunggah..."
                : "Ganti foto"}
            </button>
          )}

      </div>

      {previewOpen &&
        src && (
          <div className="kb-preview-modal">

            <div
              className="kb-preview-dialog"
              role="dialog"
              aria-modal="true"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="kb-preview-header">

                <div>
                  <strong>
                    {
                      KATEGORI_LABEL[
                        kategori
                      ]
                    }
                  </strong>

                  <span>
                    Dokumentasi lapangan
                  </span>
                </div>

                <button
                  type="button"
                  className="kb-preview-close"
                  onClick={tutupPreview}
                  aria-label="Tutup preview"
                >
                  ×
                </button>

              </div>

              <div
                className="kb-preview-body"
                onWheel={handleWheel}
                onPointerDown={mulaiDrag}
                onPointerMove={gerakDrag}
                onPointerUp={selesaiDrag}
                onPointerCancel={selesaiDrag}
                onDoubleClick={resetZoom}
                style={{
                  cursor:
                    zoom > 1
                      ? dragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                  overflow: "hidden",
                  touchAction: "none",
                }}
              >
                <img
                  src={src}
                  alt={KATEGORI_LABEL[kategori]}
                  draggable={false}
                  style={{
                    transform:
                      `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: dragging
                      ? "none"
                      : "transform 120ms ease-out",
                    maxWidth: "none",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    right: "14px",
                    bottom: "14px",
                    display: "flex",
                    gap: "6px",
                    padding: "6px",
                    borderRadius: "10px",
                    background: "rgba(10,14,20,.82)",
                    border: "1px solid rgba(255,255,255,.12)",
                    zIndex: 5,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => zoomKe(zoom - 0.25)}
                    disabled={zoom <= 0.5}
                    title="Zoom out"
                    style={{
                      width: "34px",
                      height: "34px",
                      border: 0,
                      borderRadius: "7px",
                      background: "rgba(255,255,255,.12)",
                      color: "#fff",
                      fontSize: "20px",
                      cursor: zoom <= 0.5 ? "not-allowed" : "pointer",
                    }}
                  >
                    −
                  </button>

                  <button
                    type="button"
                    onClick={resetZoom}
                    title="Reset zoom"
                    style={{
                      minWidth: "58px",
                      height: "34px",
                      border: 0,
                      borderRadius: "7px",
                      background: "rgba(255,255,255,.12)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {Math.round(zoom * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={() => zoomKe(zoom + 0.25)}
                    disabled={zoom >= 5}
                    title="Zoom in"
                    style={{
                      width: "34px",
                      height: "34px",
                      border: 0,
                      borderRadius: "7px",
                      background: "rgba(255,255,255,.12)",
                      color: "#fff",
                      fontSize: "20px",
                      cursor: zoom >= 5 ? "not-allowed" : "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    bottom: "14px",
                    padding: "6px 9px",
                    borderRadius: "7px",
                    background: "rgba(10,14,20,.68)",
                    color: "rgba(255,255,255,.82)",
                    fontSize: "11px",
                    pointerEvents: "none",
                    zIndex: 4,
                  }}
                >
                  Scroll untuk zoom · drag untuk geser · double-click reset
                </div>
              </div>

              <div className="kb-preview-footer">

                <span>
                  {
                    lampiran?.nama_asli ??
                    "Foto lapangan"
                  }
                </span>

              </div>

            </div>

          </div>
        )}
    </>
  );
}

async function bacaExif(
  file: File
): Promise<{
  lat?: number;
  lon?: number;
  diambil_pada?: string;
}> {
  if (
    !file.type.startsWith("image/")
  ) {
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

    const v =
      new DataView(buf);

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
      if (
        v.getUint16(off) ===
        0xffe1
      ) {
        const tiff =
          off + 10;

        const le =
          v.getUint16(
            tiff
          ) === 0x4949;

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
                  u32(
                    f + 8
                  );

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

          if (
            d &&
            t
          ) {
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
    // EXIF tidak wajib.
  }

  return {};
}
