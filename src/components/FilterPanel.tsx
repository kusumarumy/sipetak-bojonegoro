'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/store/useApp';

type Bidang = {
  status?: string;
  kecamatan?: string;
  kelurahan?: string;
  tipehak?: string;
  penggunaan?: string;
};

type Props = {
  onClose: () => void;
};

const STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'terkirim', label: 'Menunggu Verifikasi' },
  { value: 'terverifikasi', label: 'Terverifikasi' },
  { value: 'revisi', label: 'Perlu Revisi' },
];

function pilihanUnik(
  data: Bidang[],
  key: keyof Bidang
) {
  return Array.from(
    new Set(
      data
        .map((item) =>
          String(item[key] ?? '').trim()
        )
        .filter(Boolean)
    )
  ).sort((a, b) =>
    a.localeCompare(b, 'id')
  );
}

export default function FilterPanel({
  onClose,
}: Props) {
  const { filterBidang, setFilterBidang } = useApp();

  const [data, setData] = useState<Bidang[]>([]);
  const [memuat, setMemuat] = useState(true);

  const [status, setStatus] = useState(
    filterBidang.status ?? ''
  );

  const [kecamatan, setKecamatan] = useState(
    filterBidang.kecamatan ?? ''
  );

  const [kelurahan, setKelurahan] = useState(
    filterBidang.kelurahan ?? ''
  );

  const [tipehak, setTipehak] = useState(
    filterBidang.tipehak ?? ''
  );

  const [penggunaan, setPenggunaan] = useState(
    filterBidang.penggunaan ?? ''
  );

  useEffect(() => {
    const ambilData = async () => {
      try {
        setMemuat(true);

        const response = await fetch('/api/bidang');

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const fc = await response.json();

        const hasil: Bidang[] =
          (fc.features ?? []).map(
            (feature: any) => ({
              ...feature.properties,
            })
          );

        setData(hasil);
      } catch (error) {
        console.error(
          'Gagal mengambil data filter:',
          error
        );

        setData([]);
      } finally {
        setMemuat(false);
      }
    };

    ambilData();
  }, []);

  const daftarKecamatan = useMemo(
    () =>
      pilihanUnik(
        data,
        'kecamatan'
      ),
    [data]
  );

  const dataKelurahan = useMemo(() => {
    if (!kecamatan) {
      return data;
    }

    return data.filter(
      (item) =>
        item.kecamatan === kecamatan
    );
  }, [data, kecamatan]);

  const daftarKelurahan = useMemo(
    () =>
      pilihanUnik(
        dataKelurahan,
        'kelurahan'
      ),
    [dataKelurahan]
  );

  const daftarTipeHak = useMemo(
    () =>
      pilihanUnik(
        data,
        'tipehak'
      ),
    [data]
  );

  const daftarPenggunaan = useMemo(
    () =>
      pilihanUnik(
        data,
        'penggunaan'
      ),
    [data]
  );

  const terapkan = () => {
    setFilterBidang({
      status,
      kecamatan,
      kelurahan,
      tipehak,
      penggunaan,
    });

    onClose();
  };

  const reset = () => {
    setStatus('');
    setKecamatan('');
    setKelurahan('');
    setTipehak('');
    setPenggunaan('');

    setFilterBidang({
      status: '',
      kecamatan: '',
      kelurahan: '',
      tipehak: '',
      penggunaan: '',
    });
  };

  const jumlahFilter =
    [
      status,
      kecamatan,
      kelurahan,
      tipehak,
      penggunaan,
    ].filter(Boolean).length;

  return (
    <aside className="filter-flyout">

      {/* HEADER */}
      <header className="filter-head">

        <div className="filter-heading">

          <div className="filter-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M4 5h16l-6.2 7.1v5.4l-3.6 1.8v-7.2L4 5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <div className="filter-title">
              FILTER
            </div>

            <div className="filter-subtitle">
              Seleksi bidang tanah
            </div>
          </div>

        </div>

        <button
          type="button"
          className="filter-close"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>

      </header>

      {/* BODY */}
      <div className="filter-body">

        {memuat ? (
          <div className="filter-loading">
            Memuat pilihan filter...
          </div>
        ) : (
          <>
            {/* STATUS */}
            <div className="filter-group">
              <label>
                Status Verifikasi
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >
                <option value="">
                  Semua status
                </option>

                {STATUS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* KECAMATAN */}
            <div className="filter-group">
              <label>
                Kecamatan
              </label>

              <select
                value={kecamatan}
                onChange={(e) => {
                  setKecamatan(e.target.value);
                  setKelurahan('');
                }}
              >
                <option value="">
                  Semua kecamatan
                </option>

                {daftarKecamatan.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* KELURAHAN */}
            <div className="filter-group">
              <label>
                Kelurahan
              </label>

              <select
                value={kelurahan}
                onChange={(e) =>
                  setKelurahan(
                    e.target.value
                  )
                }
                disabled={!kecamatan}
              >
                <option value="">
                  {kecamatan
                    ? 'Semua kelurahan'
                    : 'Pilih kecamatan terlebih dahulu'}
                </option>

                {daftarKelurahan.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* TIPE HAK */}
            <div className="filter-group">
              <label>
                Tipe Hak
              </label>

              <select
                value={tipehak}
                onChange={(e) =>
                  setTipehak(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Semua tipe hak
                </option>

                {daftarTipeHak.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* PENGGUNAAN */}
            <div className="filter-group">
              <label>
                Penggunaan Tanah
              </label>

              <select
                value={penggunaan}
                onChange={(e) =>
                  setPenggunaan(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Semua penggunaan
                </option>

                {daftarPenggunaan.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* INFO */}
            {jumlahFilter > 0 && (
              <div className="filter-active-info">
                <span className="filter-active-dot" />

                <span>
                  {jumlahFilter} filter aktif
                </span>
              </div>
            )}

            {/* ACTION */}
            <div className="filter-actions">

              <button
                type="button"
                className="filter-reset"
                onClick={reset}
              >
                Reset
              </button>

              <button
                type="button"
                className="filter-apply"
                onClick={terapkan}
              >
                Terapkan Filter
              </button>

            </div>
          </>
        )}

      </div>
    </aside>
  );
}
