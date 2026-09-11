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
  | "tanaman"
  | "dokumen"
  | "riwayat";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "ringkas", label: "Ringkasan", icon: "⌂" },
  { id: "pemilik", label: "Pemilik", icon: "♙" },
  { id: "bidang", label: "Bidang", icon: "▣" },
  { id: "bangunan", label: "Bangunan", icon: "⌂" },
  { id: "tanaman", label: "Tanaman", icon: "♧" },
  { id: "dokumen", label: "Foto & Dokumen", icon: "▧" },
  { id: "riwayat", label: "Riwayat", icon: "◷" },
];

const STATUS: Record<string, string> = {
  draft: "Draft",
  terkirim: "Menunggu verifikasi",
  terverifikasi: "Terverifikasi",
  revisi: "Perlu revisi",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "status-draft",
  terkirim: "status-kirim",
  terverifikasi: "status-ok",
  revisi: "status-revisi",
};

function formatNumber(value: any) {
  if (value === null || value === undefined || value === "") return "—";

  const n = Number(value);

  if (Number.isNaN(n)) return String(value);

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(value: any) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
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
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="kb-section-body">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  edit,
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
  return (
    <div className="kb-field">
      <label>{label}</label>

      {edit ? (
        <input
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <div className="kb-value">{value || "—"}</div>
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
        {value ?? "—"}
        {suffix && <small>{suffix}</small>}
      </strong>
    </div>
  );
}

function Completeness({ bidang }: { bidang: any }) {
  const checks = [
    Boolean(bidang.pemilik?.[0]?.nama || bidang.nama_milik),
    Boolean(bidang.nib),
    Boolean(bidang.luas_m2 ?? bidang.luastertul),
    Boolean(bidang.penggunaan),
    Boolean(bidang.bangunan?.length || bidang.jml_bgn),
    Boolean(bidang.tanaman?.length || bidang.jenis_tnm),
    Boolean(bidang.foto_tnh),
  ];

  const total = checks.length;
  const complete = checks.filter(Boolean).length;
  const percent = Math.round((complete / total) * 100);

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
        <i style={{ width: `${percent}%` }} />
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

  const onClose = () => {
    void pilihBidang(null);
  };

  const [tab, setTab] = useState<TabId>("ringkas");
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);

  const status = (b?.status ?? "draft") as StatusBidang;

  const bolehEdit = dapatMengubahAtribut(
    peran,
    status
  );

  const bolehKirim = dapatMengirim(
    peran,
    status
  );

  const bolehVerifikasi = dapatMemverifikasi(
    peran,
    status
  );

const nilai = (key: string) =>
  draft[key] !== undefined
    ? draft[key]
    : (b as any)?.[key];

  const setNilai = (key: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    setTab("ringkas");
    setEdit(false);
    setDraft({});
  }, [b?.id]);
  
  const pemilik: Pemilik | null = useMemo(
  () => b?.pemilik?.[0] ?? null,
  [b]
);
const namaPemilik =
  pemilik?.nama ??
  b?.nama_milik ??
  "Pemilik belum diisi";
  const luas =
    b?.luas_m2 ??
    b?.luastertul ??
    b?.luaspeta;

  const luasTerdampak =
    b?.luas_terdampak_m2 ??
    b?.luas_atbt;

  const luasSisa = b?.luas_sisa_m2;

  const bangunan = b?.bangunan ?? [];
  const tanaman = b?.tanaman ?? [];

  const jumlahBangunan =
    bangunan.length ||
    b?.jml_bgn ||
    0;

  const jumlahTanaman =
    tanaman.length ||
    b?.jumlah_tnm ||
    0;

  async function simpan() {
    if (!b?.id) return;

    setBusy(true);

    try {
      const response = await fetch(`/api/bidang/${b.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan perubahan");
      }

      setEdit(false);
      setDraft({});

      await muatUlangKartu?.();

      beriPesan("Perubahan berhasil disimpan");
    } catch (error) {
      console.error(error);
      beriPesan("Gagal menyimpan perubahan");
    } finally {
      setBusy(false);
    }
  }

  async function pindahStatus(
    target: "terkirim" | "terverifikasi" | "revisi"
  ) {
    if (!b?.id) return;

    setBusy(true);

    try {
      const response = await fetch(`/api/bidang/${b.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: target,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengubah status");
      }

      await muatUlangKartu?.();

      beriPesan(
        target === "terkirim"
          ? "Bidang dikirim untuk verifikasi"
          : target === "terverifikasi"
            ? "Bidang berhasil diverifikasi"
            : "Bidang dikembalikan untuk revisi"
      );
    } catch (error) {
      console.error(error);
      beriPesan("Gagal mengubah status");
    } finally {
      setBusy(false);
    }
  }

  const tabContent = useMemo(() => {
    switch (tab) {
      case "ringkas":
        return (
          <>
            <Section
              title="Informasi utama"
              subtitle="Ringkasan identitas dan kondisi bidang"
            >
              <div className="kb-grid two">
                <Field
                  label="NIB"
                  value={nilai("nib") ?? b?.kode}
                  edit={edit}
                  onChange={(v) => setNilai("nib", v)}
                />

                <Field
                  label="Bidang ID"
                  value={b?.bidang_id}
                />

                <Field
                  label="Kelurahan"
                  value={b?.kelurahan ?? b?.desa}
                  edit={edit}
                  onChange={(v) => setNilai("kelurahan", v)}
                />

                <Field
                  label="Kecamatan"
                  value={b?.kecamatan}
                  edit={edit}
                  onChange={(v) => setNilai("kecamatan", v)}
                />
              </div>
            </Section>

            <Section title="Luas bidang">
              <div className="kb-stat-grid">
                <Stat
                  label="Luas bidang"
                  value={formatNumber(luas)}
                  suffix="m²"
                />

                <Stat
                  label="Terdampak"
                  value={formatNumber(luasTerdampak)}
                  suffix="m²"
                />

                <Stat
                  label="Sisa"
                  value={formatNumber(luasSisa)}
                  suffix="m²"
                />
              </div>
            </Section>

            <Section title="Penggunaan & kondisi">
              <div className="kb-grid two">
                <Field
                  label="Penggunaan"
                  value={nilai("penggunaan")}
                  edit={edit}
                  onChange={(v) => setNilai("penggunaan", v)}
                />

                <Field
                  label="Status tanah"
                  value={b?.sta_tnh}
                  edit={edit}
                  onChange={(v) => setNilai("sta_tnh", v)}
                />

                <Field
                  label="Dampak tanah"
                  value={b?.dampak_tnh}
                  edit={edit}
                  onChange={(v) => setNilai("dampak_tnh", v)}
                />

                <Field
                  label="Tanggal ukur"
                  value={b?.tanggal_ukur ?? b?.date_updt}
                />
              </div>
            </Section>

            <Completeness bidang={b} />
          </>
        );

const pemilik: Pemilik | null = useMemo(
  () => b?.pemilik?.[0] ?? null,
  [b]
);

const namaPemilik =
  pemilik?.nama ??
  b?.nama_milik ??
  "Pemilik belum diisi";

        return (
          <>
            <Section
              title="Pemilik tanah"
              subtitle="Identitas pemegang/pemilik bidang"
            >
              <div className="kb-grid two">
                <Field
                  label="Nama"
                  value={pemilik?.nama ?? b?.nama_milik}
                  edit={edit}
                  onChange={(v) => setNilai("nama_milik", v)}
                />

                <Field
                  label="NIK"
                  value={pemilik?.nik ?? b?.nik_milik}
                  edit={edit}
                  onChange={(v) => setNilai("nik_milik", v)}
                />

                <Field
  label="Tempat, tanggal lahir"
  value={b?.ttl_milik}
  edit={edit}
  onChange={(v) => setNilai("ttl_milik", v)}
/>

                <Field
                  label="Pekerjaan"
                  value={pemilik?.pekerjaan ?? b?.krja_milik}
                  edit={edit}
                  onChange={(v) => setNilai("krja_milik", v)}
                />
              </div>

              <Field
                label="Alamat"
                value={pemilik?.alamat ?? b?.almt_milik}
                edit={edit}
                onChange={(v) => setNilai("almt_milik", v)}
              />
            </Section>

            <Section
              title="Penyewa / penggarap"
              subtitle="Diisi apabila bidang memiliki pihak selain pemilik"
            >
              <div className="kb-grid two">
                <Field
                  label="Nama"
                  value={b?.nama_sewa}
                  edit={edit}
                  onChange={(v) => setNilai("nama_sewa", v)}
                />

                <Field
                  label="NIK"
                  value={b?.nik_sewa}
                  edit={edit}
                  onChange={(v) => setNilai("nik_sewa", v)}
                />

                <Field
                  label="Tempat, tanggal lahir"
                  value={b?.ttl_sewa}
                  edit={edit}
                  onChange={(v) => setNilai("ttl_sewa", v)}
                />

                <Field
                  label="Pekerjaan"
                  value={b?.krja_sewa}
                  edit={edit}
                  onChange={(v) => setNilai("krja_sewa", v)}
                />

                <Field
                  label="Nomor HP"
                  value={b?.nomor_hp}
                  edit={edit}
                  onChange={(v) => setNilai("nomor_hp", v)}
                />
              </div>

              <Field
                label="Alamat"
                value={b?.almt_sewa}
                edit={edit}
                onChange={(v) => setNilai("almt_sewa", v)}
              />
            </Section>
          </>
        );
      }

      case "bidang":
        return (
          <>
            <Section
              title="Administrasi bidang"
              subtitle="Identitas dan informasi administrasi tanah"
            >
              <div className="kb-grid two">
                <Field label="Object ID" value={b?.objectid} />
                <Field label="Bidang ID" value={b?.bidang_id} />

                <Field
                  label="Kode wilayah"
                  value={b?.kodewilaya}
                  edit={edit}
                  onChange={(v) => setNilai("kodewilaya", v)}
                />

                <Field
                  label="Kode bidang"
                  value={b?.kode_bid}
                  edit={edit}
                  onChange={(v) => setNilai("kode_bid", v)}
                />

                <Field
                  label="RT / RW"
                  value={b?.rt_rw}
                  edit={edit}
                  onChange={(v) => setNilai("rt_rw", v)}
                />

                <Field
                  label="Hubungan tanah"
                  value={b?.hub_tnh}
                  edit={edit}
                  onChange={(v) => setNilai("hub_tnh", v)}
                />
              </div>
            </Section>

            <Section title="Pengukuran">
              <div className="kb-grid two">
                <Field
                  label="Luas tertulis"
                  value={formatNumber(b?.luastertul)}
                />

                <Field
                  label="Luas peta"
                  value={formatNumber(b?.luaspeta)}
                />

                <Field
                  label="Sumber geometri"
                  value={b?.sumbergeom}
                />

                <Field
                  label="Alat ukur"
                  value={b?.alatukur}
                  edit={edit}
                  onChange={(v) => setNilai("alatukur", v)}
                />

                <Field
                  label="Metode ukur"
                  value={b?.metodukur}
                  edit={edit}
                  onChange={(v) => setNilai("metodukur", v)}
                />

                <Field
                  label="Luas tanah"
                  value={formatNumber(b?.luas_tnh)}
                />
              </div>
            </Section>

            <Section title="Hak & dokumen tanah">
              <div className="kb-grid two">
                <Field
                  label="Tipe hak"
                  value={b?.tipehak}
                  edit={edit}
                  onChange={(v) => setNilai("tipehak", v)}
                />

                <Field
                  label="Tipe produk"
                  value={b?.tipeproduk}
                  edit={edit}
                  onChange={(v) => setNilai("tipeproduk", v)}
                />

                <Field
                  label="Tahun"
                  value={b?.tahun}
                  edit={edit}
                  onChange={(v) => setNilai("tahun", v)}
                />

                <Field
                  label="Surat hak"
                  value={b?.surat_hak}
                  edit={edit}
                  onChange={(v) => setNilai("surat_hak", v)}
                />

                <Field
                  label="Nomor hak"
                  value={b?.nomor_hak}
                  edit={edit}
                  onChange={(v) => setNilai("nomor_hak", v)}
                />

                <Field
                  label="Beban hak"
                  value={b?.beban_hak}
                  edit={edit}
                  onChange={(v) => setNilai("beban_hak", v)}
                />
              </div>
            </Section>

            <Section title="Ruang & bangunan terdampak">
              <div className="kb-grid two">
                <Field
                  label="Ruang ATBT"
                  value={b?.ruang_atbt}
                  edit={edit}
                  onChange={(v) => setNilai("ruang_atbt", v)}
                />

                <Field
                  label="Luas ATBT"
                  value={formatNumber(b?.luas_atbt)}
                />

                <Field
                  label="NJOP / m²"
                  value={formatNumber(b?.njop_m2)}
                />

                <Field
                  label="Dampak tanah"
                  value={b?.dampak_tnh}
                  edit={edit}
                  onChange={(v) => setNilai("dampak_tnh", v)}
                />
              </div>
            </Section>
          </>
        );

      case "bangunan":
        return (
          <>
            <Section
              title="Bangunan"
              subtitle={`${jumlahBangunan} bangunan tercatat pada bidang`}
            >
              {bangunan.length > 0 ? (
                <div className="kb-list">
                  {bangunan.map((item: any, i: number) => (
                    <div className="kb-item-card" key={item.id ?? i}>
                      <div className="kb-item-head">
                        <div className="kb-item-number">
                          {String(i + 1).padStart(2, "0")}
                        </div>

                        <div>
                          <strong>
                            {item.jenis ?? item.jenis_bgn ?? "Bangunan"}
                          </strong>
                          <span>
                            {item.tingkat_terdampak ??
                              item.kondisi ??
                              "Data bangunan"}
                          </span>
                        </div>
                      </div>

                      <div className="kb-mini-grid">
                        <Field
                          label="Konstruksi"
                          value={item.konstruksi}
                        />

                        <Field
                          label="Luas lantai"
                          value={
                            item.luas_lantai_m2
                              ? `${formatNumber(item.luas_lantai_m2)} m²`
                              : undefined
                          }
                        />

                        <Field
                          label="Jumlah lantai"
                          value={item.jumlah_lantai}
                        />

                        <Field
                          label="Atap"
                          value={item.atap}
                        />

                        <Field
                          label="Dinding"
                          value={item.dinding}
                        />

                        <Field
                          label="Tahun dibangun"
                          value={item.tahun_dibangun}
                        />

                        <Field
                          label="Listrik"
                          value={item.listrik}
                        />

                        <Field
                          label="Air"
                          value={item.air}
                        />

                        <Field
                          label="Sanitasi"
                          value={item.sanitasi}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="kb-empty">
                  <div>⌂</div>
                  <strong>Belum ada data bangunan</strong>
                  <span>
                    Tambahkan informasi bangunan saat survei lapangan.
                  </span>
                </div>
              )}
            </Section>
          </>
        );

      case "tanaman":
        return (
          <>
            <Section
              title="Tanaman"
              subtitle={`${jumlahTanaman} tanaman tercatat pada bidang`}
            >
              {tanaman.length > 0 ? (
                <div className="kb-list">
                  {tanaman.map((item: any, i: number) => (
                    <div className="kb-item-card" key={item.id ?? i}>
                      <div className="kb-item-head">
                        <div className="kb-item-number plant">
                          {String(i + 1).padStart(2, "0")}
                        </div>

                        <div>
                          <strong>
                            {item.jenis ??
                              item.jenis_tnm ??
                              "Tanaman"}
                          </strong>
                          <span>
                            Jumlah:{" "}
                            {formatNumber(
                              item.jumlah ?? item.jumlah_tnm
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="kb-empty">
                  <div>♧</div>
                  <strong>Belum ada data tanaman</strong>
                  <span>
                    Data tanaman dapat ditambahkan dari hasil survei.
                  </span>
                </div>
              )}

              {(b?.benda_lain?.length > 0 ||
                b?.jenis_bnd ||
                b?.jumlah_bnd) && (
                <div className="kb-sub-block">
                  <div className="kb-sub-title">Benda lain</div>

                  <div className="kb-grid two">
                    <Field
                      label="Jenis"
                      value={b?.jenis_bnd}
                      edit={edit}
                      onChange={(v) => setNilai("jenis_bnd", v)}
                    />

                    <Field
                      label="Jumlah"
                      value={b?.jumlah_bnd}
                      edit={edit}
                      onChange={(v) => setNilai("jumlah_bnd", v)}
                    />
                  </div>
                </div>
              )}
            </Section>
          </>
        );

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

      case "riwayat":
        return (
          <Section
            title="Riwayat bidang"
            subtitle="Aktivitas dan perubahan data"
          >
            {b?.riwayat?.length ? (
              <div className="kb-timeline">
                {b.riwayat.map((item: any, i: number) => (
                  <div className="kb-timeline-item" key={item.id ?? i}>
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
                        <small>{item.nama_pengguna}</small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kb-empty">
                <div>◷</div>
                <strong>Belum ada riwayat</strong>
                <span>Aktivitas bidang akan muncul di sini.</span>
              </div>
            )}
          </Section>
        );
    }
  }, [
    tab,
    edit,
    draft,
    b,
    peran,
    bolehEdit,
    bangunan,
    tanaman,
    jumlahBangunan,
    jumlahTanaman,
  ]);

  return (
    <aside className="kartu open kb-modern">
      <style jsx>{`
        .kb-modern {
          --kb-red: #8f2635;
          --kb-red-dark: #741e2b;
          --kb-red-soft: rgba(143, 38, 53, 0.1);
          --kb-bg: var(--panel, #ffffff);
          --kb-bg2: var(--panel-2, #f8f8fa);
          --kb-line: var(--line, #e4e5e9);
          --kb-text: var(--text, #202124);
          --kb-muted: var(--muted, #737780);

          width: min(480px, calc(100vw - 24px));
          height: calc(100vh - 24px);
          top: 12px;
          right: 12px;
          bottom: 12px;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background: var(--kb-bg);
          color: var(--kb-text);

          border: 1px solid var(--kb-line);
          border-radius: 18px;

          box-shadow:
            0 18px 50px rgba(0, 0, 0, 0.18),
            0 2px 8px rgba(0, 0, 0, 0.08);

          z-index: 40;
        }

        .kb-header {
          flex: 0 0 auto;
          padding: 16px 16px 12px;
          border-bottom: 1px solid var(--kb-line);
          background: var(--kb-bg);
        }

        .kb-header-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .kb-close {
          width: 34px;
          height: 34px;
          border: 1px solid var(--kb-line);
          border-radius: 10px;
          background: var(--kb-bg2);
          color: var(--kb-text);
          font-size: 18px;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .kb-title {
          min-width: 0;
          flex: 1;
        }

        .kb-eyebrow {
          display: block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: var(--kb-muted);
          margin-bottom: 3px;
        }

        .kb-title strong {
          display: block;
          font-size: 18px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .kb-owner {
          display: block;
          margin-top: 3px;
          color: var(--kb-muted);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .kb-status {
          flex: 0 0 auto;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-draft {
          background: #eef0f3;
          color: #60656d;
        }

        .status-kirim {
          background: #fff3df;
          color: #996018;
        }

        .status-ok {
          background: #e5f5ed;
          color: #28734b;
        }

        .status-revisi {
          background: #fde8eb;
          color: #a72e42;
        }

        .kb-completeness {
          margin-top: 13px;
          padding: 10px 11px;
          background: var(--kb-bg2);
          border: 1px solid var(--kb-line);
          border-radius: 12px;
        }

        .kb-completeness-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: var(--kb-muted);
        }

        .kb-completeness-top div {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .kb-completeness-top strong {
          color: var(--kb-red);
          font-size: 13px;
        }

        .kb-progress {
          height: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--kb-line);
          margin-top: 7px;
        }

        .kb-progress i {
          display: block;
          height: 100%;
          background: var(--kb-red);
          border-radius: inherit;
          transition: width 0.25s ease;
        }

        .kb-tabs {
          flex: 0 0 auto;
          display: flex;
          gap: 4px;
          padding: 8px 10px;
          overflow-x: auto;
          border-bottom: 1px solid var(--kb-line);
          background: var(--kb-bg);
          scrollbar-width: none;
        }

        .kb-tabs::-webkit-scrollbar {
          display: none;
        }

        .kb-tab {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 34px;
          padding: 0 11px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: var(--kb-muted);
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
        }

        .kb-tab:hover {
          background: var(--kb-bg2);
          color: var(--kb-text);
        }

        .kb-tab.active {
          color: white;
          background: var(--kb-red);
          box-shadow: 0 4px 10px rgba(143, 38, 53, 0.18);
        }

        .kb-tab-icon {
          font-size: 13px;
        }

        .kb-scroll {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 14px;
          background: var(--kb-bg2);
        }

        .kb-section {
          margin-bottom: 12px;
          padding: 14px;
          background: var(--kb-bg);
          border: 1px solid var(--kb-line);
          border-radius: 13px;
        }

        .kb-section-head {
          margin-bottom: 12px;
        }

        .kb-section-head h3 {
          margin: 0;
          font-size: 13px;
          line-height: 1.3;
        }

        .kb-section-head p {
          margin: 3px 0 0;
          color: var(--kb-muted);
          font-size: 10px;
          line-height: 1.45;
        }

        .kb-grid {
          display: grid;
          gap: 10px;
        }

        .kb-grid.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .kb-field {
          min-width: 0;
        }

        .kb-field + .kb-field {
          margin-top: 0;
        }

        .kb-field label {
          display: block;
          margin-bottom: 4px;
          color: var(--kb-muted);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.045em;
        }

        .kb-value {
          min-height: 18px;
          font-size: 12px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .kb-field input {
          width: 100%;
          min-height: 38px;
          box-sizing: border-box;
          padding: 8px 10px;
          border: 1px solid var(--kb-line);
          border-radius: 9px;
          background: var(--kb-bg2);
          color: var(--kb-text);
          outline: none;
          font: inherit;
          font-size: 12px;
        }

        .kb-field input:focus {
          border-color: var(--kb-red);
          box-shadow: 0 0 0 3px var(--kb-red-soft);
        }

        .kb-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .kb-stat {
          padding: 11px;
          background: var(--kb-bg2);
          border: 1px solid var(--kb-line);
          border-radius: 10px;
        }

        .kb-stat span {
          display: block;
          color: var(--kb-muted);
          font-size: 9px;
        }

        .kb-stat strong {
          display: block;
          margin-top: 5px;
          font-size: 15px;
          line-height: 1.1;
        }

        .kb-stat small {
          margin-left: 3px;
          color: var(--kb-muted);
          font-size: 9px;
          font-weight: 500;
        }

        .kb-list {
          display: grid;
          gap: 9px;
        }

        .kb-item-card {
          padding: 11px;
          border: 1px solid var(--kb-line);
          border-radius: 11px;
          background: var(--kb-bg2);
        }

        .kb-item-head {
          display: flex;
          gap: 9px;
          align-items: center;
          margin-bottom: 10px;
        }

        .kb-item-number {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: var(--kb-red-soft);
          color: var(--kb-red);
          font-size: 10px;
          font-weight: 800;
          flex: 0 0 auto;
        }

        .kb-item-number.plant {
          border-radius: 50%;
        }

        .kb-item-head strong {
          display: block;
          font-size: 12px;
        }

        .kb-item-head span {
          display: block;
          margin-top: 2px;
          color: var(--kb-muted);
          font-size: 10px;
        }

        .kb-mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .kb-sub-block {
          margin-top: 15px;
          padding-top: 14px;
          border-top: 1px solid var(--kb-line);
        }

        .kb-sub-title {
          margin-bottom: 10px;
          font-size: 11px;
          font-weight: 750;
        }

        .kb-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 150px;
          text-align: center;
          color: var(--kb-muted);
        }

        .kb-empty > div {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          margin-bottom: 9px;
          border-radius: 12px;
          background: var(--kb-red-soft);
          color: var(--kb-red);
          font-size: 19px;
        }

        .kb-empty strong {
          color: var(--kb-text);
          font-size: 12px;
        }

        .kb-empty span {
          max-width: 260px;
          margin-top: 4px;
          font-size: 10px;
          line-height: 1.5;
        }

        .kb-timeline {
          position: relative;
          padding-left: 4px;
        }

        .kb-timeline-item {
          position: relative;
          display: flex;
          gap: 10px;
          padding-bottom: 17px;
        }

        .kb-timeline-item:last-child {
          padding-bottom: 0;
        }

        .kb-timeline-dot {
          width: 9px;
          height: 9px;
          margin-top: 4px;
          border-radius: 50%;
          background: var(--kb-red);
          box-shadow: 0 0 0 4px var(--kb-red-soft);
          flex: 0 0 auto;
        }

        .kb-timeline-content {
          flex: 1;
          min-width: 0;
        }

        .kb-timeline-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .kb-timeline-top strong {
          font-size: 11px;
        }

        .kb-timeline-top span {
          color: var(--kb-muted);
          font-size: 9px;
          white-space: nowrap;
        }

        .kb-timeline-content p {
          margin: 4px 0 0;
          color: var(--kb-muted);
          font-size: 10px;
          line-height: 1.45;
        }

        .kb-timeline-content small {
          display: block;
          margin-top: 5px;
          color: var(--kb-muted);
          font-size: 9px;
        }

        .kb-footer {
          flex: 0 0 auto;
          display: flex;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid var(--kb-line);
          background: var(--kb-bg);
        }

        .kb-footer button {
          min-height: 40px;
          border: 0;
          border-radius: 10px;
          padding: 0 13px;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .kb-primary {
          flex: 1;
          background: var(--kb-red);
          color: white;
        }

        .kb-primary:hover {
          background: var(--kb-red-dark);
        }

        .kb-secondary {
          background: var(--kb-bg2);
          border: 1px solid var(--kb-line) !important;
          color: var(--kb-text);
        }

        .kb-danger {
          background: #fff0f2;
          color: #a72e42;
        }

        .kb-footer button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 700px) {
          .kb-modern {
            width: 100vw;
            height: 100dvh;
            max-height: none;
            top: 0;
            right: 0;
            bottom: 0;
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }

          .kb-header {
            padding-top: max(12px, env(safe-area-inset-top));
          }

          .kb-tabs {
            padding-left: 9px;
            padding-right: 9px;
          }

          .kb-scroll {
            padding: 10px;
            padding-bottom: 14px;
          }

          .kb-section {
            padding: 12px;
            border-radius: 12px;
          }

          .kb-grid.two {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .kb-stat-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .kb-mini-grid {
            grid-template-columns: 1fr;
          }

          .kb-field input {
            min-height: 44px;
            font-size: 14px;
          }

          .kb-value {
            font-size: 13px;
          }

          .kb-footer {
            padding:
              9px
              10px
              max(9px, env(safe-area-inset-bottom));
          }

          .kb-footer button {
            min-height: 46px;
          }
        }

        @media (max-width: 380px) {
          .kb-stat-grid {
            grid-template-columns: 1fr;
          }

          .kb-status {
            display: none;
          }
        }
      `}</style>

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
            <span className="kb-eyebrow">Kartu bidang tanah</span>

            <strong>
              {b?.kode ?? b?.bidang_id ?? b?.nib ?? "Bidang"}
            </strong>

            <span className="kb-owner">
              {namaPemilik}
            </span>
          </div>

          <span
            className={`kb-status ${
              STATUS_CLASS[status] ?? "status-draft"
            }`}
          >
            {STATUS[status] ?? status}
          </span>
        </div>

        <Completeness bidang={b} />
      </header>

      {/* TABS */}
      <nav className="kb-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={`kb-tab ${
              tab === item.id ? "active" : ""
            }`}
            onClick={() => setTab(item.id)}
          >
            <span className="kb-tab-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
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
              className="kb-primary"
              disabled={busy}
              onClick={simpan}
            >
              {busy ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          </>
       ) : (
  <>
    {bolehEdit && (
      <button
        className="kb-secondary"
        disabled={busy}
        onClick={() => setEdit(true)}
      >
        ✎ Edit data
      </button>
    )}

    {bolehKirim && (
      <button
        className="kb-primary"
        disabled={busy}
        onClick={() => pindahStatus("terkirim")}
      >
        {busy ? "Memproses…" : "Kirim verifikasi"}
      </button>
    )}

    {bolehVerifikasi && (
      <>
        <button
          className="kb-danger"
          disabled={busy}
          onClick={() => pindahStatus("revisi")}
        >
          Revisi
        </button>

        <button
          className="kb-primary"
          disabled={busy}
          onClick={() => pindahStatus("terverifikasi")}
        >
          Verifikasi
        </button>
      </>
    )}

    {!bolehEdit &&
      !bolehKirim &&
      !bolehVerifikasi && (
        <button
          className="kb-primary"
          disabled
        >
          {status === "terverifikasi"
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
