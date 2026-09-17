'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/store/useApp';

type HasilBidang = {
  id: string | number;
  kode_bid?: string;
  nib?: string;
  nama_milik?: string;
  nik_milik?: string;
  kelurahan?: string;
  kecamatan?: string;
};

type Props = {
  onClose: () => void;
};

export default function SearchPanel({
  onClose,
}: Props) {
  const { pilihBidang } = useApp();

  const [query, setQuery] = useState('');
  const [data, setData] = useState<HasilBidang[]>([]);
  const [memuat, setMemuat] = useState(false);

  useEffect(() => {
    const ambilData = async () => {
      try {
        setMemuat(true);

        const response =
          await fetch('/api/bidang');

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const fc =
          await response.json();

        const hasil: HasilBidang[] =
          (fc.features ?? []).map(
            (feature: any) => ({
              id:
                feature.id ??
                feature.properties?.id,

              ...feature.properties,
            })
          );

        setData(hasil);

      } catch (error) {
        console.error(
          'Gagal mengambil data pencarian:',
          error
        );

        setData([]);

      } finally {
        setMemuat(false);
      }
    };

    ambilData();
  }, []);

  const hasil = (() => {
    const keyword =
      query.trim().toLowerCase();

    if (!keyword) return [];

    return data
      .filter((item) => {
        const fields = [
          item.kode_bid,
          item.nib,
          item.nama_milik,
          item.nik_milik,
          item.kelurahan,
          item.kecamatan,
        ];

        return fields.some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(keyword)
        );
      })
      .slice(0, 20);
  })();

const bukaBidang = (
  item: HasilBidang
) => {
  const id = String(item.id);

  // Buka Kartu Bidang
  pilihBidang(id);

  // Minta peta memfokuskan bidang
  window.dispatchEvent(
    new CustomEvent('fokus-bidang', {
      detail: { id },
    })
  );
};
const resetPencarian = () => {
  window.dispatchEvent(
    new CustomEvent('reset-pilihan-bidang')
  );

  setQuery('');
};
  return (
    <aside className="search-flyout">

      <header className="search-head">

        <div className="search-heading">

          <div className="search-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="10.5"
                cy="10.5"
                r="6.5"
              />
              <path d="M16 16l5 5" />
            </svg>
          </div>

          <div className="search-head-actions">
  <button
    type="button"
    className="search-reset"
    onClick={resetPencarian}
    disabled={!query}
  >
    ↻ Reset
  </button>

  <button
    type="button"
    className="search-close"
    onClick={() => {
      resetPencarian();
      onClose();
    }}
    aria-label="Tutup"
  >
    ×
  </button>
</div>

<button
  type="button"
  className="search-close"
  onClick={() => {
    resetPencarian();
    onClose();
  }}
  aria-label="Tutup"
>
  ×
</button>

      </header>

      <div className="search-body">

        <div className="search-input-wrap">

          <svg
            className="search-input-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="10.5"
              cy="10.5"
              r="6.5"
            />
            <path d="M16 16l5 5" />
          </svg>

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="NIB, nama pemilik, NIK..."
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian"
            >
              ×
            </button>
          )}

        </div>

        {memuat ? (

          <div className="search-loading">
            Memuat data bidang...
          </div>

        ) : query.trim() === '' ? (

          <div className="search-empty">

            <div className="search-empty-icon">
              ⌕
            </div>

            <strong>
              Cari bidang
            </strong>

            <span>
              Masukkan NIB, nama pemilik,
              NIK, kelurahan, atau kecamatan.
            </span>

          </div>

        ) : hasil.length === 0 ? (

          <div className="search-empty">

            <div className="search-empty-icon">
              ×
            </div>

            <strong>
              Tidak ditemukan
            </strong>

            <span>
              Tidak ada bidang yang sesuai
              dengan pencarian.
            </span>

          </div>

        ) : (

          <div className="search-results">

            <div className="search-result-count">
              {hasil.length} hasil
            </div>

            {hasil.map((item) => (

              <button
                key={item.id}
                type="button"
                className="search-result-item"
                onClick={() =>
                  bukaBidang(item)
                }
              >

                <div className="search-result-main">

                  <strong>
                    {item.nib ||
                      item.kode_bid ||
                      `Bidang ${item.id}`}
                  </strong>

                  <span>
                    {item.nama_milik ||
                      'Pemilik belum diisi'}
                  </span>

                </div>

                <div className="search-result-location">

                  <span>
                    {item.kelurahan ||
                      'Kelurahan -'}
                  </span>

                  <span>
                    {item.kecamatan ||
                      'Kecamatan -'}
                  </span>

                </div>

                <span className="search-result-arrow">
                  →
                </span>

              </button>

            ))}

          </div>

        )}

      </div>

    </aside>
  );
}
