'use client';

import { useMemo } from 'react';

export type DataBangunan = {
  fid?: number | string | null;
  id?: string | null;

  jenis_bgn?: string | null;
  fungsi_bgn?: string | null;

  jml_bgn?: number | null;
  jml_lnt?: number | null;
  luas_bgn?: number | null;

  alamat_bgn?: string | null;

  update?: string | null;
  date_updt?: string | null;

  foto_bgn?: string | null;
};

type Props = {
  bangunan: DataBangunan;
  onClose: () => void;
};

function nilai(
  value: unknown,
  fallback = '—'
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return fallback;
  }

  return String(value);
}

function formatAngka(
  value: number | string | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return String(value);
  }

  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(n);
}

function formatTanggal(
  value: string | null | undefined
) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  ).format(date);
}

function fotoUrl(
  value: string | null | undefined
) {
  if (!value) return null;

  const url = value.trim();

  if (!url) return null;

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/')
  ) {
    return url;
  }

  return url;
}

export default function KartuBangunan({
  bangunan,
  onClose,
}: Props) {

  const foto = useMemo(
    () => fotoUrl(bangunan.foto_bgn),
    [bangunan.foto_bgn]
  );

  return (
    <div
      className="kartu-bangunan"
      role="dialog"
      aria-label="Kartu bangunan"
    >

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="kartu-bangunan-header">

        <div className="kartu-bangunan-title-wrap">

          <div className="kartu-bangunan-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M4 21V8l8-5 8 5v13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M8 21v-7h8v7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              <path
                d="M8 10h.01M12 10h.01M16 10h.01"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>

            <div className="kartu-bangunan-eyebrow">
              KARTU BANGUNAN
            </div>

            <div className="kartu-bangunan-id">
              {nilai(bangunan.id)}
            </div>

          </div>

        </div>

        <button
          type="button"
          className="kartu-bangunan-close"
          onClick={onClose}
          aria-label="Tutup kartu bangunan"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

      </div>


      {/* =====================================================
          FOTO BANGUNAN
          ===================================================== */}

      {foto && (
        <div className="kartu-bangunan-photo">

          <img
            src={foto}
            alt={`Foto bangunan ${nilai(bangunan.id)}`}
            loading="lazy"
          />

        </div>
      )}


      {/* =====================================================
          ISI
          ===================================================== */}

      <div className="kartu-bangunan-body">

        {/* INFORMASI IDENTITAS */}

        <section className="kartu-bangunan-section">

          <div className="kartu-bangunan-section-title">
            Informasi bangunan
          </div>

          <div className="kartu-bangunan-grid">

            <div className="kartu-bangunan-field">
              <span>FID</span>
              <strong>
                {nilai(bangunan.fid)}
              </strong>
            </div>

            <div className="kartu-bangunan-field">
              <span>ID</span>
              <strong>
                {nilai(bangunan.id)}
              </strong>
            </div>

            <div className="kartu-bangunan-field">
              <span>Jenis bangunan</span>
              <strong>
                {nilai(bangunan.jenis_bgn)}
              </strong>
            </div>

            <div className="kartu-bangunan-field">
              <span>Fungsi bangunan</span>
              <strong>
                {nilai(bangunan.fungsi_bgn)}
              </strong>
            </div>

          </div>

        </section>


        {/* JUMLAH DAN LUAS */}

        <section className="kartu-bangunan-section">

          <div className="kartu-bangunan-section-title">
            Data fisik
          </div>

          <div className="kartu-bangunan-grid">

            <div className="kartu-bangunan-field">
              <span>Jumlah bangunan</span>
              <strong>
                {formatAngka(
                  bangunan.jml_bgn
                )}
              </strong>
            </div>

            <div className="kartu-bangunan-field">
              <span>Jumlah lantai</span>
              <strong>
                {formatAngka(
                  bangunan.jml_lnt
                )}
              </strong>
            </div>

            <div className="kartu-bangunan-field full">
              <span>Luas bangunan</span>
              <strong>
                {formatAngka(
                  bangunan.luas_bgn
                )} m²
              </strong>
            </div>

          </div>

        </section>


        {/* ALAMAT */}

        <section className="kartu-bangunan-section">

          <div className="kartu-bangunan-section-title">
            Lokasi
          </div>

          <div className="kartu-bangunan-address">

            <span>Alamat bangunan</span>

            <strong>
              {nilai(
                bangunan.alamat_bgn
              )}
            </strong>

          </div>

        </section>


        {/* UPDATE */}

        <section className="kartu-bangunan-section">

          <div className="kartu-bangunan-section-title">
            Informasi data
          </div>

          <div className="kartu-bangunan-grid">

            <div className="kartu-bangunan-field">
              <span>Update</span>
              <strong>
                {nilai(bangunan.update)}
              </strong>
            </div>

            <div className="kartu-bangunan-field">
              <span>Tanggal update</span>
              <strong>
                {formatTanggal(
                  bangunan.date_updt
                )}
              </strong>
            </div>

          </div>

        </section>


        {/* FOTO BELUM TERSEDIA */}

        {!foto && (
          <div className="kartu-bangunan-no-photo">

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              />

              <circle
                cx="8"
                cy="10"
                r="1.5"
                fill="currentColor"
              />

              <path
                d="M4 17l5-5 3 3 2-2 6 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span>
              Foto bangunan belum tersedia
            </span>

          </div>
        )}

      </div>

    </div>
  );
}
