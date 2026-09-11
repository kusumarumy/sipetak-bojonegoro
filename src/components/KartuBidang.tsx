"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/store/useApp";
import UnggahBerkas from "./UnggahBerkas";
import type { Peran, StatusBidang, Pemilik } from "@/types";
import {
  dapatMengubahAtribut,
  dapatMengirim,
  dapatMemverifikasi,
} from "@/lib/rbac";

type TabId =
  | "ringkas"
  | "pemilik"
  | "bidang"
  | "bangunan"
  | "dokumen"
  | "riwayat";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "ringkas", label: "Ringkasan", icon: "⌂" },
  { id: "pemilik", label: "Pemilik", icon: "♙" },
  { id: "bidang", label: "Bidang", icon: "▣" },
  { id: "bangunan", label: "Bangunan", icon: "▤" },
  { id: "dokumen", label: "Foto & Dokumen", icon: "▧" },
  { id: "riwayat", label: "Riwayat", icon: "◷" },
];

const STATUS: Record<StatusBidang, string> = {
  draft: "Draft",
  terkirim: "Menunggu verifikasi",
  terverifikasi: "Terverifikasi",
  revisi: "Perlu revisi",
};

const STATUS_CLASS: Record<StatusBidang, string> = {
  draft: "status-draft",
  terkirim: "status-kirim",
  terverifikasi: "status-ok",
  revisi: "status-revisi",
};

function formatNumber(value: any) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const n = Number(value);

  if (Number.isNaN(n)) {
    return String(value);
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(value: any) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function Field({
  label,
  value,
  edit = false,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: any;
  edit?: boolean;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const displayValue =
    value === null ||
    value === undefined ||
    value === ""
      ? "—"
      : String(value);

  return (
    <div className="kb-field">
      <label>{label}</label>

      {edit ? (
        <input
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) =>
            onChange?.(e.target.value)
          }
        />
      ) : (
        <div className="kb-value">
          {displayValue}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: any;
  suffix?: string;
}) {
  return (
    <div className="kb-stat">
      <span>{label}</span>

      <strong>
        {value === null ||
        value === undefined ||
        value === ""
          ? "—"
          : value}

        {suffix && <small>{suffix}</small>}
      </strong>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="kb-section">
      <div className="kb-section-head">
        <div>
          <h3>{title}</h3>

          {subtitle && (
            <p>{subtitle}</p>
          )}
        </div>
      </div>

      <div className="kb-section-body">
        {children}
      </div>
    </section>
  );
}

function Completeness({
  bidang,
}: {
  bidang: any;
}) {
  /*
   * Mengacu pada data yang memang tersedia
   * pada bidang_tanah / lampiran.
   */
  const checks = [
    Boolean(
      bidang?.nama_milik ||
        bidang?.pemilik?.[0]?.nama
    ),
    Boolean(bidang?.nib),
    bidang?.luas_tnh != null ||
      bidang?.luastertul != null ||
      bidang?.luaspeta != null,
    Boolean(bidang?.penggunaan),
    bidang?.jml_bgn != null,
    Boolean(
      bidang?.lampiran?.some(
        (x: any) =>
          x.kategori ===
          "foto_bidang"
      ) ||
        bidang?.foto_tnh
    ),
  ];

  const total = checks.length;
  const complete =
    checks.filter(Boolean).length;

  const percent =
    total > 0
      ? Math.round(
          (complete / total) * 100
        )
      : 0;

  return (
    <div className="kb-completeness">
      <div className="kb-completeness-top">
        <div>
          <span>Kelengkapan data</span>
          <strong>{percent}%</strong>
        </div>

        <span>
          {complete}/{total} komponen
        </span>
      </div>

      <div className="kb-progress">
        <i
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function KartuBidang({
  peran,
}: {
  peran: Peran;
}) {
  const {
    kartu: b,
    pilihBidang,
    muatUlangKartu,
    beriPesan,
  } = useApp();

  const [tab, setTab] =
    useState<TabId>("ringkas");

  const [edit, setEdit] =
    useState(false);

  const [draft, setDraft] =
    useState<Record<string, any>>({});

  const [busy, setBusy] =
    useState(false);

  const status: StatusBidang =
    b?.status ?? "draft";

  const bolehEdit = b
    ? dapatMengubahAtribut(
        peran,
        b.status
      )
    : false;

  const bolehKirim = b
    ? dapatMengirim(
        peran,
        b.status
      )
    : false;

  const bolehVerifikasi = b
    ? dapatMemverifikasi(
        peran,
        b.status
      )
    : false;

  const nilai = (key: string) =>
    draft[key] !== undefined
      ? draft[key]
      : (b as any)?.[key];

  const setNilai = (
    key: string,
    value: any
  ) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (!b?.id) return;

    setTab("ringkas");
    setEdit(false);
    setDraft({});
  }, [b?.id]);

  const pemilik: Pemilik | null =
    useMemo(
      () => b?.pemilik?.[0] ?? null,
      [b]
    );

  const namaPemilik =
    b?.nama_milik ??
    pemilik?.nama ??
    "Pemilik belum diisi";

  /*
   * Semua luas diambil dari kolom database.
   *
   * luas_tnh       = luas tanah
   * luas_terdampak_m2 = luas terdampak
   * luas_sisa_m2      = luas sisa
   */
  const luas =
    b?.luas_tnh ??
    b?.luastertul ??
    b?.luaspeta;

  const luasTerdampak =
    b?.luas_terdampak_m2;

  const luasSisa =
    b?.luas_sisa_m2;

  /*
   * Database hanya menyimpan jumlah bangunan
   * melalui jml_bgn.
   *
   * Jangan membuat data bangunan palsu
   * dari jumlah tersebut.
   */
  const jumlahBangunan =
    b?.jml_bgn ?? 0;

  async function simpan() {
    if (!b?.id) return;

    if (
      Object.keys(draft).length === 0
    ) {
      setEdit(false);
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `/api/bidang/${b.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(draft),
        }
      );

      const text =
        await response.text();

      if (!response.ok) {
        throw new Error(
          text ||
            "Gagal menyimpan perubahan"
        );
      }

      setEdit(false);
      setDraft({});

      await muatUlangKartu();

      beriPesan(
        "Perubahan berhasil disimpan"
      );
    } catch (error) {
      console.error(error);

      beriPesan(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan perubahan"
      );
    } finally {
      setBusy(false);
    }
  }

  async function pindahStatus(
    target:
      | "terkirim"
      | "terverifikasi"
      | "revisi"
  ) {
    if (!b?.id) return;

    setBusy(true);

    try {
      const response = await fetch(
        `/api/bidang/${b.id}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: target,
          }),
        }
      );

      const text =
        await response.text();

      if (!response.ok) {
        throw new Error(
          text ||
            "Gagal mengubah status"
        );
      }

      await muatUlangKartu();

      beriPesan(
        target === "terkirim"
          ? "Bidang dikirim untuk verifikasi"
          : target ===
              "terverifikasi"
            ? "Bidang berhasil diverifikasi"
            : "Bidang dikembalikan untuk revisi"
      );
    } catch (error) {
      console.error(error);

      beriPesan(
        error instanceof Error
          ? error.message
          : "Gagal mengubah status"
      );
    } finally {
      setBusy(false);
    }
  }

  const tabContent = useMemo(() => {
    if (!b) return null;

    switch (tab) {
      /* =====================================================
         RINGKASAN
      ===================================================== */
      case "ringkas":
        return (
          <>
            <Section
              title="Informasi utama"
              subtitle="Identitas utama bidang tanah"
            >
              <div className="kb-grid two">
                <Field
                  label="NIB"
                  value={nilai("nib")}
                  edit={edit}
                  onChange={(v) =>
                    setNilai("nib", v)
                  }
                />

                <Field
                  label="Bidang ID"
                  value={b.bidang_id}
                />

                <Field
                  label="Kelurahan"
                  value={
                    nilai("kelurahan") ??
                    b.desa
                  }
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "kelurahan",
                      v
                    )
                  }
                />

                <Field
                  label="Kecamatan"
                  value={nilai(
                    "kecamatan"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "kecamatan",
                      v
                    )
                  }
                />

                <Field
                  label="RT / RW"
                  value={nilai("rt_rw")}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "rt_rw",
                      v
                    )
                  }
                />

                <Field
                  label="Tipe hak"
                  value={nilai("tipehak")}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "tipehak",
                      v
                    )
                  }
                />
              </div>
            </Section>

            <Section title="Luas bidang">
              <div className="kb-stat-grid">
                <Stat
                  label="Luas bidang"
                  value={formatNumber(
                    luas
                  )}
                  suffix="m²"
                />

                <Stat
                  label="Terdampak"
                  value={formatNumber(
                    luasTerdampak
                  )}
                  suffix="m²"
                />

                <Stat
                  label="Sisa"
                  value={formatNumber(
                    luasSisa
                  )}
                  suffix="m²"
                />
              </div>
            </Section>

            <Section title="Penggunaan & kondisi">
              <div className="kb-grid two">
                <Field
                  label="Penggunaan"
                  value={nilai(
                    "penggunaan"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "penggunaan",
                      v
                    )
                  }
                />

                <Field
                  label="Status tanah"
                  value={nilai("sta_tnh")}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "sta_tnh",
                      v
                    )
                  }
                />

                <Field
                  label="Dampak tanah"
                  value={nilai(
                    "dampak_tnh"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "dampak_tnh",
                      v
                    )
                  }
                />

                <Field
                  label="Hubungan tanah"
                  value={nilai("hub_tnh")}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "hub_tnh",
                      v
                    )
                  }
                />
              </div>
            </Section>

            <Section title="Status pendataan">
              <div className="kb-grid two">
                <Field
                  label="Petugas"
                  value={
                    b.petugas_nama
                  }
                />

                <Field
                  label="Tanggal ukur"
                  value={formatDate(
                    b.tanggal_ukur
                  )}
                />

                <Field
                  label="Dikirim pada"
                  value={formatDate(
                    b.dikirim_pada
                  )}
                />

                <Field
                  label="Diverifikasi pada"
                  value={formatDate(
                    b.diverifikasi_pada
                  )}
                />
              </div>

              {b.catatan_supervisor && (
                <Field
                  label="Catatan supervisor"
                  value={
                    b.catatan_supervisor
                  }
                />
              )}
            </Section>

            <Completeness
              bidang={b}
            />
          </>
        );

      /* =====================================================
         PEMILIK
      ===================================================== */
      case "pemilik":
        return (
          <>
            <Section
              title="Pemilik tanah"
              subtitle="Data pemilik dari bidang_tanah"
            >
              <div className="kb-grid two">
                <Field
                  label="Nama"
                  value={nilai(
                    "nama_milik"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "nama_milik",
                      v
                    )
                  }
                />

                <Field
                  label="NIK"
                  value={nilai(
                    "nik_milik"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "nik_milik",
                      v
                    )
                  }
                />

                <Field
                  label="Tempat, tanggal lahir"
                  value={nilai(
                    "ttl_milik"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "ttl_milik",
                      v
                    )
                  }
                />

                <Field
                  label="Pekerjaan"
                  value={nilai(
                    "krja_milik"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "krja_milik",
                      v
                    )
                  }
                />
              </div>

              <Field
                label="Alamat"
                value={nilai(
                  "almt_milik"
                )}
                edit={edit}
                onChange={(v) =>
                  setNilai(
                    "almt_milik",
                    v
                  )
                }
              />
            </Section>

            <Section
              title="Penyewa / penggarap"
              subtitle="Data pihak yang menggunakan atau menggarap tanah"
            >
              <div className="kb-grid two">
                <Field
                  label="Nama"
                  value={nilai(
                    "nama_sewa"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "nama_sewa",
                      v
                    )
                  }
                />

                <Field
                  label="NIK"
                  value={nilai(
                    "nik_sewa"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "nik_sewa",
                      v
                    )
                  }
                />

                <Field
                  label="Tempat, tanggal lahir"
                  value={nilai(
                    "ttl_sewa"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "ttl_sewa",
                      v
                    )
                  }
                />

                <Field
                  label="Pekerjaan"
                  value={nilai(
                    "krja_sewa"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "krja_sewa",
                      v
                    )
                  }
                />

                <Field
                  label="Nomor HP"
                  value={nilai(
                    "nomor_hp"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "nomor_hp",
                      v
                    )
                  }
                />
              </div>

              <Field
                label="Alamat"
                value={nilai(
                  "almt_sewa"
                )}
                edit={edit}
                onChange={(v) =>
                  setNilai(
                    "almt_sewa",
                    v
                  )
                }
              />
            </Section>
          </>
        );

      /* =====================================================
         BIDANG
      ===================================================== */
      case "bidang":
        return (
          <>
            <Section
              title="Identitas bidang"
              subtitle="Atribut yang berasal langsung dari bidang_tanah"
            >
              <div className="kb-grid two">
                <Field
                  label="ID"
                  value={b.id}
                />

                <Field
                  label="Object ID"
                  value={b.objectid}
                />

                <Field
                  label="Bidang ID"
                  value={b.bidang_id}
                />

                <Field
                  label="Kode bidang"
                  value={nilai("kode_bid")}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "kode_bid",
                      v
                    )
                  }
                />

                <Field
                  label="Kode wilayah"
                  value={
                    b.kodewilaya
                  }
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "kodewilaya",
                      v
                    )
                  }
                />

                <Field
                  label="FID"
                  value={b.fid}
                />

                <Field
                  label="RT / RW"
                  value={nilai("rt_rw")}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "rt_rw",
                      v
                    )
                  }
                />

                <Field
                  label="Layer"
                  value={b.layer}
                />
              </div>
            </Section>

            <Section title="Pengukuran & geometri">
              <div className="kb-grid two">
                <Field
                  label="Luas tanah"
                  value={formatNumber(
                    b.luas_tnh
                  )}
                />

                <Field
                  label="Luas tertulis"
                  value={formatNumber(
                    b.luastertul
                  )}
                />

                <Field
                  label="Luas peta"
                  value={formatNumber(
                    b.luaspeta
                  )}
                />

                <Field
                  label="Luas ATBT"
                  value={formatNumber(
                    b.luas_atbt
                  )}
                />

                <Field
                  label="Luas terdampak"
                  value={formatNumber(
                    b.luas_terdampak_m2
                  )}
                />

                <Field
                  label="Luas sisa"
                  value={formatNumber(
                    b.luas_sisa_m2
                  )}
                />

                <Field
                  label="Sumber geometri"
                  value={b.sumbergeom}
                />

                <Field
                  label="Panjang geometri"
                  value={formatNumber(
                    b.shape_leng
                  )}
                />

                <Field
                  label="Luas geometri"
                  value={formatNumber(
                    b.shape_area
                  )}
                />

                <Field
                  label="Alat ukur"
                  value={nilai(
                    "alatukur"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "alatukur",
                      v
                    )
                  }
                />

                <Field
                  label="Metode ukur"
                  value={nilai(
                    "metodukur"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "metodukur",
                      v
                    )
                  }
                />
              </div>
            </Section>

            <Section title="Hak & dokumen tanah">
              <div className="kb-grid two">
                <Field
                  label="Tipe hak"
                  value={nilai(
                    "tipehak"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "tipehak",
                      v
                    )
                  }
                />

                <Field
                  label="Tipe produk"
                  value={nilai(
                    "tipeproduk"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "tipeproduk",
                      v
                    )
                  }
                />

                <Field
                  label="Tahun"
                  value={nilai("tahun")}
                  edit={edit}
                  type="number"
                  onChange={(v) =>
                    setNilai(
                      "tahun",
                      v
                    )
                  }
                />

                <Field
                  label="Surat hak"
                  value={nilai(
                    "surat_hak"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "surat_hak",
                      v
                    )
                  }
                />

                <Field
                  label="Nomor hak"
                  value={nilai(
                    "nomor_hak"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "nomor_hak",
                      v
                    )
                  }
                />

                <Field
                  label="Alas hak"
                  value={nilai(
                    "alas_hak"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "alas_hak",
                      v
                    )
                  }
                />

                <Field
                  label="Beban hak"
                  value={nilai(
                    "beban_hak"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "beban_hak",
                      v
                    )
                  }
                />
              </div>
            </Section>

            <Section title="Informasi tanah">
              <div className="kb-grid two">
                <Field
                  label="Penggunaan"
                  value={nilai(
                    "penggunaan"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "penggunaan",
                      v
                    )
                  }
                />

                <Field
                  label="Hubungan tanah"
                  value={nilai(
                    "hub_tnh"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "hub_tnh",
                      v
                    )
                  }
                />

                <Field
                  label="Kode WWC"
                  value={b.kode_wwc}
                />

                <Field
                  label="Jenis tanah"
                  value={b.jenis_tnh}
                />

                <Field
                  label="Ruang ATBT"
                  value={nilai(
                    "ruang_atbt"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "ruang_atbt",
                      v
                    )
                  }
                />

                <Field
                  label="Dampak tanah"
                  value={nilai(
                    "dampak_tnh"
                  )}
                  edit={edit}
                  onChange={(v) =>
                    setNilai(
                      "dampak_tnh",
                      v
                    )
                  }
                />
              </div>
            </Section>
          </>
        );

      /* =====================================================
         BANGUNAN
      ===================================================== */
      case "bangunan":
        return (
          <Section
            title="Bangunan"
            subtitle="Jumlah bangunan yang tercatat pada bidang"
          >
            <div className="kb-stat-grid">
              <Stat
                label="Jumlah bangunan"
                value={formatNumber(
                  b.jml_bgn
                )}
                suffix="unit"
              />
            </div>

            <div className="kb-info-box">
              <strong>
                Data bangunan
              </strong>

              <span>
                Database bidang_tanah saat ini
                menyimpan jumlah bangunan melalui
                kolom <b>jml_bgn</b>. Detail jenis,
                konstruksi, luas lantai, dan kondisi
                bangunan belum tersedia sebagai kolom
                pada tabel tersebut.
              </span>
            </div>
          </Section>
        );

      /* =====================================================
         DOKUMEN
      ===================================================== */
      case "dokumen":
        return (
          <Section
            title="Foto & dokumen"
            subtitle="Dokumentasi lapangan dan dokumen pendukung bidang"
          >
            <UnggahBerkas
              bidang={b}
              peran={peran}
              bolehEdit={bolehEdit}
            />
          </Section>
        );

      /* =====================================================
         RIWAYAT
      ===================================================== */
      case "riwayat":
        return (
          <Section
            title="Riwayat bidang"
            subtitle="Aktivitas dan perubahan data"
          >
            {b.riwayat?.length ? (
              <div className="kb-timeline">
                {b.riwayat.map(
                  (
                    item: any,
                    i: number
                  ) => (
                    <div
                      className="kb-timeline-item"
                      key={
                        item.id ?? i
                      }
                    >
                      <div className="kb-timeline-dot" />

                      <div className="kb-timeline-content">
                        <div className="kb-timeline-top">
                          <strong>
                            {item.judul ??
                              item.aksi ??
                              item.status ??
                              "Aktivitas"}
                          </strong>

                          <span>
                            {formatDate(
                              item.created_at ??
                                item.tanggal ??
                                item.waktu
                            )}
                          </span>
                        </div>

                        <p>
                          {item.keterangan ??
                            item.deskripsi ??
                            "Perubahan data bidang"}
                        </p>

                        {item.nama_pengguna && (
                          <small>
                            {
                              item.nama_pengguna
                            }
                          </small>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="kb-empty">
                <div>◷</div>

                <strong>
                  Belum ada riwayat
                </strong>

                <span>
                  Aktivitas bidang akan muncul di sini.
                </span>
              </div>
            )}
          </Section>
        );

      default:
        return null;
    }
  }, [
    tab,
    edit,
    draft,
    b,
    peran,
    bolehEdit,
    luas,
    luasTerdampak,
    luasSisa,
    jumlahBangunan,
    pemilik,
  ]);

  if (!b) {
    return null;
  }

  const onClose = () => {
    void pilihBidang(null);
  };

  return (
    <aside className="kartu open kb-modern">

      {/* HEADER */}
      <header className="kb-header">
        <div className="kb-header-top">
          <button
            className="kb-close"
            onClick={onClose}
            aria-label="Tutup kartu bidang"
          >
            ×
          </button>

          <div className="kb-title">
            <span className="kb-eyebrow">
              Kartu bidang tanah
            </span>

            <strong>
              {b.kode_bid ??
                b.bidang_id ??
                b.nib ??
                "Bidang"}
            </strong>

            <span className="kb-owner">
              {namaPemilik}
            </span>
          </div>

          <span
            className={`kb-status ${
              STATUS_CLASS[status]
            }`}
          >
            {STATUS[status]}
          </span>
        </div>

        <Completeness
          bidang={b}
        />
      </header>

      {/* TABS */}
      <nav className="kb-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`kb-tab ${
              tab === item.id
                ? "active"
                : ""
            }`}
            onClick={() =>
              setTab(item.id)
            }
          >
            <span className="kb-tab-icon">
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <div className="kb-scroll">
        {tabContent}
      </div>

      {/* FOOTER */}
      <footer className="kb-footer">
        {edit ? (
          <>
            <button
              type="button"
              className="kb-secondary"
              disabled={busy}
              onClick={() => {
                setEdit(false);
                setDraft({});
              }}
            >
              Batal
            </button>

            <button
              type="button"
              className="kb-primary"
              disabled={busy}
              onClick={simpan}
            >
              {busy
                ? "Menyimpan…"
                : "Simpan perubahan"}
            </button>
          </>
        ) : (
          <>
            {bolehEdit && (
              <button
                type="button"
                className="kb-secondary"
                disabled={busy}
                onClick={() =>
                  setEdit(true)
                }
              >
                ✎ Edit data
              </button>
            )}

            {bolehKirim && (
              <button
                type="button"
                className="kb-primary"
                disabled={busy}
                onClick={() =>
                  pindahStatus(
                    "terkirim"
                  )
                }
              >
                {busy
                  ? "Memproses…"
                  : "Kirim verifikasi"}
              </button>
            )}

            {bolehVerifikasi && (
              <>
                <button
                  type="button"
                  className="kb-danger"
                  disabled={busy}
                  onClick={() =>
                    pindahStatus(
                      "revisi"
                    )
                  }
                >
                  Revisi
                </button>

                <button
                  type="button"
                  className="kb-primary"
                  disabled={busy}
                  onClick={() =>
                    pindahStatus(
                      "terverifikasi"
                    )
                  }
                >
                  Verifikasi
                </button>
              </>
            )}

            {!bolehEdit &&
              !bolehKirim &&
              !bolehVerifikasi && (
                <button
                  type="button"
                  className="kb-primary"
                  disabled
                >
                  {status ===
                  "terverifikasi"
                    ? "✓ Terverifikasi"
                    : "Tidak ada tindakan"}
                </button>
              )}
          </>
        )}
      </footer>
    </aside>
  );
}
