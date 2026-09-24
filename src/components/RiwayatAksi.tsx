"use client";

import { useEffect, useMemo, useState } from "react";

type AuditLog = {
  id?: number | string;

  // ID bidang_tanah
  record_id?: number | string;

  // FID bidang_tanah
  fid?: number | string;

  // NIB bidang_tanah
  nib?: string;

  aksi?: string;
  kolom?: string;

  nilai_lama?: any;
  nilai_baru?: any;

  nama_akun?: string;
  pengguna_id?: string;
  ip_address?: string;
  pada?: string;
};

type Props = {
  onClose: () => void;
};

const fmtTanggal = (value?: string) => {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtNilai = (value: any) => {
  if (value == null || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const labelAksi: Record<string, string> = {
  UPLOAD: "UPLOAD",
  INPUT: "INPUT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
};

export default function RiwayatAksi({
  onClose,
}: Props) {
  const [data, setData] = useState<AuditLog[]>([]);
  const [memuat, setMemuat] = useState(true);

  const [filter, setFilter] =
    useState("semua");

  const [sortKolom, setSortKolom] =
    useState("pada");

  const [sortArah, setSortArah] =
    useState<"asc" | "desc">("desc");

  const ubahSort = (kolom: string) => {
    if (sortKolom === kolom) {
      setSortArah(
        sortArah === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortKolom(kolom);
      setSortArah("asc");
    }
  };

  useEffect(() => {
    const ambilData = async () => {
      try {
        setMemuat(true);

        const r = await fetch(
          "/api/riwayat",
          {
            cache: "no-store",
          }
        );

        if (!r.ok) {
          const pesan = await r.text();

          throw new Error(
            pesan || `HTTP ${r.status}`
          );
        }

        const hasil = await r.json();

        setData(
          Array.isArray(hasil)
            ? hasil
            : []
        );
      } catch (err) {
        console.error(
          "Gagal mengambil riwayat aksi:",
          err
        );

        setData([]);
      } finally {
        setMemuat(false);
      }
    };

    ambilData();
  }, []);

  /* =================================================
     JUMLAH AKSI
     ================================================= */

  const jumlah = useMemo(() => {
    return {
      semua: data.length,

      input: data.filter(
        (d) =>
          d.aksi?.toUpperCase() ===
          "INPUT"
      ).length,

      update: data.filter(
        (d) =>
          d.aksi?.toUpperCase() ===
          "UPDATE"
      ).length,

      upload: data.filter(
        (d) =>
          d.aksi?.toUpperCase() ===
          "UPLOAD"
      ).length,

      delete: data.filter(
        (d) =>
          d.aksi?.toUpperCase() ===
          "DELETE"
      ).length,
    };
  }, [data]);

  /* =================================================
     DATA TAMPIL
     ================================================= */

  const dataTampil = useMemo(() => {
    const hasil =
      filter === "semua"
        ? [...data]
        : data.filter(
            (d) =>
              d.aksi?.toUpperCase() ===
              filter.toUpperCase()
          );

    hasil.sort((a, b) => {
      let nilaiA: string | number = "";
      let nilaiB: string | number = "";

      switch (sortKolom) {
        case "pada":
          nilaiA = a.pada
            ? new Date(
                a.pada
              ).getTime()
            : 0;

          nilaiB = b.pada
            ? new Date(
                b.pada
              ).getTime()
            : 0;

          break;

        case "nama_akun":
          nilaiA =
            a.nama_akun ?? "";

          nilaiB =
            b.nama_akun ?? "";

          break;

        case "nib":
          nilaiA = a.nib ?? "";
          nilaiB = b.nib ?? "";

          break;

        case "id":
          nilaiA = String(
            a.record_id ?? ""
          );

          nilaiB = String(
            b.record_id ?? ""
          );

          break;

        case "aksi":
          nilaiA = a.aksi ?? "";
          nilaiB = b.aksi ?? "";

          break;

        case "kolom":
          nilaiA = a.kolom ?? "";
          nilaiB = b.kolom ?? "";

          break;

        case "nilai_lama":
          nilaiA = fmtNilai(
            a.nilai_lama
          );

          nilaiB = fmtNilai(
            b.nilai_lama
          );

          break;

        case "nilai_baru":
          nilaiA = fmtNilai(
            a.nilai_baru
          );

          nilaiB = fmtNilai(
            b.nilai_baru
          );

          break;
      }

      let hasilSort = 0;

      if (
        typeof nilaiA === "number" &&
        typeof nilaiB === "number"
      ) {
        hasilSort =
          nilaiA - nilaiB;
      } else {
        hasilSort = String(
          nilaiA
        ).localeCompare(
          String(nilaiB),
          "id-ID",
          {
            numeric: true,
          }
        );
      }

      return sortArah === "asc"
        ? hasilSort
        : -hasilSort;
    });

    return hasil;
  }, [
    data,
    filter,
    sortKolom,
    sortArah,
  ]);

  /* =================================================
     ICON SORT
     ================================================= */

  const iconSort = (
    kolom: string
  ) => {
    if (sortKolom !== kolom) {
      return "↕";
    }

    return sortArah === "asc"
      ? "↑"
      : "↓";
  };

  return (
    <div className="daftar-flyout">

      <section className="daftar-bidang">

        <div className="daftar-head">

          <div className="daftar-head-row">

            <div className="daftar-head-top">

              <div className="daftar-head-main">

                <div className="daftar-head-icon">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 7v5l3 2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M20 12a8 8 0 1 1-2.34-5.66"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />

                    <path
                      d="M17 4v4h4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="daftar-title-wrap">

                  <div className="daftar-title">

                    <strong>
                      RIWAYAT AKSI
                    </strong>

                    <span className="daftar-count">
                      {memuat
                        ? "Memuat…"
                        : `${dataTampil.length.toLocaleString(
                            "id-ID"
                          )} aktivitas`}
                    </span>

                  </div>

                  <span className="daftar-subtitle">
                    Audit trail aktivitas perubahan data
                  </span>

                </div>

              </div>

            </div>

            {/* =================================================
                ACTIONS
                ================================================= */}

            <div className="daftar-actions">

              {/* CLOSE */}

              <button
                type="button"
                className="daftar-close"
                onClick={onClose}
                aria-label="Tutup riwayat aksi"
                title="Tutup"
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

              {/* SEMUA */}

              <button
                type="button"
                className={
                  filter === "semua"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("semua")
                }
              >
                SEMUA ({jumlah.semua})
              </button>

              {/* INPUT */}

              <button
                type="button"
                className={
                  filter === "INPUT"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("INPUT")
                }
              >
                INPUT ({jumlah.input})
              </button>

              {/* UPDATE */}

              <button
                type="button"
                className={
                  filter === "UPDATE"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("UPDATE")
                }
              >
                UPDATE ({jumlah.update})
              </button>

              {/* UPLOAD */}

              <button
                type="button"
                className={
                  filter === "UPLOAD"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("UPLOAD")
                }
              >
                UPLOAD ({jumlah.upload})
              </button>

              {/* DELETE */}

              <button
                type="button"
                className={
                  filter === "DELETE"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("DELETE")
                }
              >
                DELETE ({jumlah.delete})
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            TABLE
            ================================================= */}

        <div className="daftar-table-wrap">

          <table className="daftar-table">

            <thead>

              <tr>

                {/* WAKTU */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort("pada")
                    }
                  >
                    <span>
                      WAKTU
                    </span>

                    <span className="sort-icon">
                      {iconSort("pada")}
                    </span>
                  </button>
                </th>

                {/* NAMA AKUN */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort(
                        "nama_akun"
                      )
                    }
                  >
                    <span>
                      NAMA AKUN
                    </span>

                    <span className="sort-icon">
                      {iconSort(
                        "nama_akun"
                      )}
                    </span>
                  </button>
                </th>

                {/* NIB */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort("nib")
                    }
                  >
                    <span>
                      NIB
                    </span>

                    <span className="sort-icon">
                      {iconSort("nib")}
                    </span>
                  </button>
                </th>

                {/* ID */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort("id")
                    }
                  >
                    <span>
                      ID
                    </span>

                    <span className="sort-icon">
                      {iconSort("id")}
                    </span>
                  </button>
                </th>

                {/* AKSI */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort("aksi")
                    }
                  >
                    <span>
                      AKSI
                    </span>

                    <span className="sort-icon">
                      {iconSort("aksi")}
                    </span>
                  </button>
                </th>

                {/* KOLOM */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort("kolom")
                    }
                  >
                    <span>
                      KOLOM
                    </span>

                    <span className="sort-icon">
                      {iconSort("kolom")}
                    </span>
                  </button>
                </th>

                {/* NILAI LAMA */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort(
                        "nilai_lama"
                      )
                    }
                  >
                    <span>
                      NILAI LAMA
                    </span>

                    <span className="sort-icon">
                      {iconSort(
                        "nilai_lama"
                      )}
                    </span>
                  </button>
                </th>

                {/* NILAI BARU */}

                <th>
                  <button
                    type="button"
                    className="sort-header"
                    onClick={() =>
                      ubahSort(
                        "nilai_baru"
                      )
                    }
                  >
                    <span>
                      NILAI BARU
                    </span>

                    <span className="sort-icon">
                      {iconSort(
                        "nilai_baru"
                      )}
                    </span>
                  </button>
                </th>

              </tr>

            </thead>

            <tbody>

              {memuat ? (

                <tr>
                  <td
                    colSpan={8}
                    className="daftar-empty"
                  >
                    Memuat riwayat aksi...
                  </td>
                </tr>

              ) : dataTampil.length === 0 ? (

                <tr>
                  <td
                    colSpan={8}
                    className="daftar-empty"
                  >
                    Tidak ada riwayat aksi.
                  </td>
                </tr>

              ) : (

                dataTampil.map(
                  (item, i) => (

                    <tr
                      key={
                        item.id ?? i
                      }
                    >

                      {/* WAKTU */}

                      <td>
                        {fmtTanggal(
                          item.pada
                        )}
                      </td>

                      {/* NAMA AKUN */}

                      <td>
                        {item.nama_akun ??
                          "—"}
                      </td>

                      {/* NIB */}

                      <td className="kode">
                        {item.nib ??
                          "—"}
                      </td>

                      {/* ID */}

                      <td className="kode">
                        {item.record_id ??
                          "—"}
                      </td>

                      {/* AKSI */}

                      <td>

                        <span
                          className={`status-daftar audit-${
                            item.aksi?.toLowerCase() ??
                            ""
                          }`}
                        >

                          <span className="status-dot" />

                          {
                            labelAksi[
                              item.aksi?.toUpperCase() ??
                                ""
                            ] ??
                            item.aksi ??
                            "—"
                          }

                        </span>

                      </td>

                      {/* KOLOM */}

                      <td>
                        {item.kolom ??
                          "—"}
                      </td>

                      {/* NILAI LAMA */}

                      <td>
                        {fmtNilai(
                          item.nilai_lama
                        )}
                      </td>

                      {/* NILAI BARU */}

                      <td>
                        {fmtNilai(
                          item.nilai_baru
                        )}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}
