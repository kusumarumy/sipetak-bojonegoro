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
  {
    value: 'draft',
    label: 'Draft',
  },
  {
    value: 'terkirim',
    label: 'Menunggu Verifikasi',
  },
  {
    value: 'terverifikasi',
    label: 'Terverifikasi',
  },
  {
    value: 'revisi',
    label: 'Perlu Revisi',
  },
];


/* =========================================================
   UTILITAS
   ========================================================= */

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


function cocok(
  value: string | undefined,
  selected: string[]
) {
  if (!selected.length) {
    return true;
  }

  return selected.includes(
    String(value ?? '').trim()
  );
}


/* =========================================================
   MULTI SELECT
   ========================================================= */

function MultiSelect({
  label,
  values,
  options,
  placeholder,
  disabled = false,
  onChange,
}: {
  label: string;
  values: string[];
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] =
    useState(false);

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(
        values.filter(
          (item) => item !== value
        )
      );
    } else {
      onChange([
        ...values,
        value,
      ]);
    }
  };

  const hapusSemua = () => {
    onChange([]);
  };

  return (
    <div className="filter-modern-group">

      <div className="filter-modern-label-row">

        <label>
          {label}
        </label>

        {values.length > 0 && (
          <button
            type="button"
            className="filter-clear-mini"
            onClick={hapusSemua}
          >
            Hapus
          </button>
        )}

      </div>


      <div className="filter-select-wrap">

        <button
          type="button"
          className={`filter-multi-trigger ${
            open ? 'is-open' : ''
          } ${
            values.length
              ? 'has-value'
              : ''
          }`}
          disabled={disabled}
          onClick={() =>
            setOpen(!open)
          }
        >

          <div className="filter-trigger-content">

            {values.length === 0 ? (
              <span className="filter-placeholder">
                {placeholder}
              </span>
            ) : (
              <>

                {values
                  .slice(0, 2)
                  .map((value) => (
                    <span
                      key={value}
                      className="filter-chip"
                    >
                      {value}
                    </span>
                  ))}

                {values.length > 2 && (
                  <span className="filter-chip-more">
                    +{values.length - 2}
                  </span>
                )}

              </>
            )}

          </div>


          <svg
            className="filter-chevron"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="m6 9 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

        </button>


        {open && !disabled && (

          <>

            <div
              className="filter-select-backdrop"
              onClick={() =>
                setOpen(false)
              }
            />

            <div className="filter-dropdown">

              <div className="filter-dropdown-head">

                <span>
                  Pilih {label.toLowerCase()}
                </span>

                {values.length > 0 && (
                  <button
                    type="button"
                    onClick={hapusSemua}
                  >
                    Bersihkan
                  </button>
                )}

              </div>


              <div className="filter-dropdown-list">

                {options.length === 0 ? (

                  <div className="filter-empty">
                    Tidak ada data
                  </div>

                ) : (

                  options.map((option) => {

                    const selected =
                      values.includes(
                        option
                      );

                    return (
                      <button
                        type="button"
                        key={option}
                        className={`filter-option ${
                          selected
                            ? 'is-selected'
                            : ''
                        }`}
                        onClick={() =>
                          toggle(option)
                        }
                      >

                        <span
                          className={`filter-checkbox ${
                            selected
                              ? 'checked'
                              : ''
                          }`}
                        >
                          {selected && (
                            <svg
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path
                                d="m5 10 3 3 7-7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>

                        <span className="filter-option-name">
                          {option}
                        </span>

                      </button>
                    );
                  })

                )}

              </div>


              <div className="filter-dropdown-footer">

                <span>
                  {values.length} dipilih
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                >
                  Selesai
                </button>

              </div>

            </div>

          </>
        )}

      </div>

    </div>
  );
}


/* =========================================================
   MAIN
   ========================================================= */

export default function FilterPanel({
  onClose,
}: Props) {

  const {
    filterBidang,
    setFilterBidang,
  } = useApp();


  const [data, setData] =
    useState<Bidang[]>([]);

  const [memuat, setMemuat] =
    useState(true);


/* =======================================================
   STATE FILTER
   ======================================================= */

const [status, setStatus] =
  useState<string[]>(
    Array.isArray(filterBidang.status)
      ? filterBidang.status
      : filterBidang.status
        ? [filterBidang.status]
        : []
  );

const [kecamatan, setKecamatan] =
  useState<string[]>(
    Array.isArray(filterBidang.kecamatan)
      ? filterBidang.kecamatan
      : filterBidang.kecamatan
        ? [filterBidang.kecamatan]
        : []
  );

const [kelurahan, setKelurahan] =
  useState<string[]>(
    Array.isArray(filterBidang.kelurahan)
      ? filterBidang.kelurahan
      : filterBidang.kelurahan
        ? [filterBidang.kelurahan]
        : []
  );

const [tipehak, setTipehak] =
  useState<string[]>(
    Array.isArray(filterBidang.tipehak)
      ? filterBidang.tipehak
      : filterBidang.tipehak
        ? [filterBidang.tipehak]
        : []
  );

const [penggunaan, setPenggunaan] =
  useState<string[]>(
    Array.isArray(filterBidang.penggunaan)
      ? filterBidang.penggunaan
      : filterBidang.penggunaan
        ? [filterBidang.penggunaan]
        : []
  );

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


  /* =======================================================
     PILIHAN KECAMATAN
     ======================================================= */

  const daftarKecamatan =
    useMemo(
      () =>
        pilihanUnik(
          data,
          'kecamatan'
        ),
      [data]
    );


  /* =======================================================
     DATA SESUAI KECAMATAN
     ======================================================= */

  const dataKelurahan =
    useMemo(() => {

      if (!kecamatan.length) {
        return data;
      }

      return data.filter(
        (item) =>
          cocok(
            item.kecamatan,
            kecamatan
          )
      );

    }, [
      data,
      kecamatan,
    ]);


  /* =======================================================
     PILIHAN KELURAHAN
     ======================================================= */

  const daftarKelurahan =
    useMemo(
      () =>
        pilihanUnik(
          dataKelurahan,
          'kelurahan'
        ),
      [dataKelurahan]
    );


  /* =======================================================
     PILIHAN TIPE HAK
     ======================================================= */

  const daftarTipeHak =
    useMemo(
      () =>
        pilihanUnik(
          data,
          'tipehak'
        ),
      [data]
    );


  /* =======================================================
     PILIHAN PENGGUNAAN
     ======================================================= */

  const daftarPenggunaan =
    useMemo(
      () =>
        pilihanUnik(
          data,
          'penggunaan'
        ),
      [data]
    );


const hasilFilter = useMemo(() => {

  return data.filter((item) => {

    if (
      !cocok(
        item.status,
        status
      )
    ) {
      return false;
    }

    if (
      !cocok(
        item.kecamatan,
        kecamatan
      )
    ) {
      return false;
    }

    if (
      !cocok(
        item.kelurahan,
        kelurahan
      )
    ) {
      return false;
    }

    if (
      !cocok(
        item.tipehak,
        tipehak
      )
    ) {
      return false;
    }

    if (
      !cocok(
        item.penggunaan,
        penggunaan
      )
    ) {
      return false;
    }

    return true;
  });

}, [
  data,
  status,
  kecamatan,
  kelurahan,
  tipehak,
  penggunaan,
]);

const jumlahFilter =
  status.length +
  kecamatan.length +
  kelurahan.length +
  tipehak.length +
  penggunaan.length;

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

  setStatus([]);

  setKecamatan([]);
  setKelurahan([]);
  setTipehak([]);
  setPenggunaan([]);

  setFilterBidang({

    status: [],

    kecamatan: [],
    kelurahan: [],
    tipehak: [],
    penggunaan: [],

  });

};


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <aside className="filter-flyout">

      {/* =================================================
          HEADER
      ================================================= */}

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
              FILTER BIDANG
            </div>

            <div className="filter-subtitle">
              Seleksi dan sorot bidang pada peta
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


      {/* =================================================
          BODY
      ================================================= */}

      <div className="filter-body">

        {memuat ? (

          <div className="filter-loading">

            <span className="filter-loading-dot" />

            Memuat data bidang...

          </div>

        ) : (

          <>

            {/* =============================================
                HASIL
            ============================================= */}

            <div className="filter-result-card">

              <div className="filter-result-icon">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />

                  <circle
                    cx="12"
                    cy="9"
                    r="2.2"
                    fill="currentColor"
                  />
                </svg>

              </div>


              <div className="filter-result-info">

                <span>
                  BIDANG TERPILIH
                </span>

                <strong>
                  {hasilFilter.length.toLocaleString(
                    'id-ID'
                  )}
                </strong>

              </div>


              <div className="filter-result-total">

                dari{' '}

                {data.length.toLocaleString(
                  'id-ID'
                )}

              </div>

            </div>

<div className="filter-modern-group">

  <div className="filter-modern-label-row">

    <label>
      Status Verifikasi
    </label>

    {status.length > 0 && (
      <button
        type="button"
        className="filter-clear-mini"
        onClick={() => setStatus([])}
      >
        Hapus
      </button>
    )}

  </div>

  <div className="filter-status-grid">

    <button
      type="button"
      className={`filter-status-option ${
        status.length === 0
          ? 'is-selected'
          : ''
      }`}
      onClick={() => setStatus([])}
    >
      Semua
    </button>

    {STATUS.map((item) => {

      const selected =
        status.includes(item.value);

      return (
        <button
          type="button"
          key={item.value}
          className={`filter-status-option status-${item.value} ${
            selected
              ? 'is-selected'
              : ''
          }`}
          onClick={() => {

            if (selected) {
              setStatus(
                status.filter(
                  (value) =>
                    value !== item.value
                )
              );
            } else {
              setStatus([
                ...status,
                item.value
              ]);
            }

          }}
        >
          {item.label}
        </button>
      );

    })}

  </div>

</div>
            <MultiSelect
              label="Kecamatan"
              values={kecamatan}
              options={
                daftarKecamatan
              }
              placeholder="Semua kecamatan"
              onChange={(values) => {

                setKecamatan(values);

                /*
                 * Hapus kelurahan yang
                 * tidak lagi masuk kecamatan.
                 */
                setKelurahan(
                  kelurahan.filter(
                    (item) =>
                      daftarKelurahan.includes(
                        item
                      )
                  )
                );

              }}
            />


            {/* =============================================
                KELURAHAN
            ============================================= */}

            <MultiSelect
              label="Kelurahan"
              values={kelurahan}
              options={
                daftarKelurahan
              }
              disabled={
                !kecamatan.length
              }
              placeholder={
                kecamatan.length
                  ? 'Semua kelurahan'
                  : 'Pilih kecamatan terlebih dahulu'
              }
              onChange={
                setKelurahan
              }
            />


            {/* =============================================
                TIPE HAK
            ============================================= */}

            <MultiSelect
              label="Tipe Hak"
              values={tipehak}
              options={
                daftarTipeHak
              }
              placeholder="Semua tipe hak"
              onChange={
                setTipehak
              }
            />


            {/* =============================================
                PENGGUNAAN
            ============================================= */}

            <MultiSelect
              label="Penggunaan Tanah"
              values={penggunaan}
              options={
                daftarPenggunaan
              }
              placeholder="Semua penggunaan"
              onChange={
                setPenggunaan
              }
            />


            {/* =============================================
                FILTER AKTIF
            ============================================= */}

            {jumlahFilter > 0 && (

              <div className="filter-active-box">

                <div className="filter-active-head">

                  <span className="filter-active-dot" />

                  <span>
                    {jumlahFilter} pilihan aktif
                  </span>

                </div>


                <div className="filter-active-chips">

  {status.map((value) => {

    const item =
      STATUS.find(
        (statusItem) =>
          statusItem.value === value
      );

    return (
      <span
        className="filter-summary-chip"
        key={`s-${value}`}
      >
        {item?.label ?? value}
      </span>
    );

  })}

  {kecamatan.map(
    (item) => (
      <span
        className="filter-summary-chip"
        key={`k-${item}`}
      >
        {item}
      </span>
    )
  )}

  {kelurahan.map(
    (item) => (
      <span
        className="filter-summary-chip"
        key={`l-${item}`}
      >
        {item}
      </span>
    )
  )}

  {tipehak.map(
    (item) => (
      <span
        className="filter-summary-chip"
        key={`h-${item}`}
      >
        {item}
      </span>
    )
  )}

  {penggunaan.map(
    (item) => (
      <span
        className="filter-summary-chip"
        key={`p-${item}`}
      >
        {item}
      </span>
    )
  )}

</div>
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

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="m5 12 4 4L19 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                Terapkan
              </button>

            </div>

          </>

        )}

      </div>

    </aside>
  );
}
