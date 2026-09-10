'use client';

import { useEffect, useMemo, useState } from 'react';

type Bidang = {
  status?: string;
  kelurahan?: string;
  kecamatan?: string;
  tipehak?: string;
  penggunaan?: string;
};

type Props = {
  onClose: () => void;
};

type StatistikItem = {
  label: string;
  jumlah: number;
};

function hitung(
  data: Bidang[],
  key: keyof Bidang
): StatistikItem[] {
  const map = new Map<string, number>();

  for (const item of data) {
    const value =
      String(item[key] ?? '').trim() || 'Tidak diketahui';

    map.set(value, (map.get(value) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, jumlah]) => ({
      label,
      jumlah,
    }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

function BarList({
  data,
  limit = 8,
}: {
  data: StatistikItem[];
  limit?: number;
}) {
  const tampil = data.slice(0, limit);

  const max = Math.max(
    ...tampil.map((item) => item.jumlah),
    1
  );

  return (
    <div className="stat-list">
      {tampil.map((item) => (
        <div
          className="stat-row"
          key={item.label}
        >
          <div className="stat-row-head">
            <span>{item.label}</span>
            <strong>{item.jumlah.toLocaleString('id-ID')}</strong>
          </div>

          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${(item.jumlah / max) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Statistika({
  onClose,
}: Props) {
  const [bidang, setBidang] = useState<Bidang[]>([]);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    const ambilData = async () => {
      try {
        setMemuat(true);

        const r = await fetch('/api/bidang');

        if (!r.ok) {
          throw new Error(
            `HTTP ${r.status}`
          );
        }

        const fc = await r.json();

        const data: Bidang[] =
          (fc.features ?? []).map(
            (f: any) => ({
              ...f.properties,
            })
          );

        setBidang(data);
      } catch (err) {
        console.error(
          'Gagal mengambil statistik:',
          err
        );

        setBidang([]);
      } finally {
        setMemuat(false);
      }
    };

    ambilData();
  }, []);

  const status = useMemo(() => {
    const values = [
      {
        label: 'DRAFT',
        key: 'draft',
      },
      {
        label: 'MENUNGGU VERIFIKASI',
        key: 'terkirim',
      },
      {
        label: 'TERVERIFIKASI',
        key: 'terverifikasi',
      },
      {
        label: 'PERLU REVISI',
        key: 'revisi',
      },
    ];

    return values.map((item) => ({
      label: item.label,
      jumlah: bidang.filter(
        (b) => b.status === item.key
      ).length,
    }));
  }, [bidang]);

  const kelurahan = useMemo(
    () => hitung(bidang, 'kelurahan'),
    [bidang]
  );

  const kecamatan = useMemo(
    () => hitung(bidang, 'kecamatan'),
    [bidang]
  );

  const tipeHak = useMemo(
    () => hitung(bidang, 'tipehak'),
    [bidang]
  );

  const penggunaan = useMemo(
    () => hitung(bidang, 'penggunaan'),
    [bidang]
  );

  return (
    <div className="statistik-flyout">

      <section className="statistik-panel">

        <header className="statistik-head">
          <div>
            <span className="statistik-eyebrow">
              ANALISIS DATA
            </span>

            <h2>Statistika</h2>

            <p>
              Rekapitulasi bidang tanah
              terdampak pembangunan trace jalan.
            </p>
          </div>

          <button
            type="button"
            className="statistik-close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {memuat ? (
          <div className="statistik-loading">
            Memuat statistik...
          </div>
        ) : (
          <div className="statistik-body">

            {/* TOTAL */}
            <div className="stat-total">
              <span>TOTAL BIDANG TERDAMPAK</span>

              <strong>
                {bidang.length.toLocaleString(
                  'id-ID'
                )}
              </strong>
            </div>

            {/* STATUS */}
            <section className="stat-section">
              <div className="stat-section-title">
                PROGRES VERIFIKASI
              </div>

              <BarList
                data={status}
                limit={4}
              />
            </section>

            {/* KELURAHAN */}
            <section className="stat-section">
              <div className="stat-section-title">
                BIDANG PER KELURAHAN
              </div>

              <BarList
                data={kelurahan}
                limit={8}
              />
            </section>

            {/* KECAMATAN */}
            <section className="stat-section">
              <div className="stat-section-title">
                BIDANG PER KECAMATAN
              </div>

              <BarList
                data={kecamatan}
                limit={8}
              />
            </section>

            {/* TIPE HAK */}
            <section className="stat-section">
              <div className="stat-section-title">
                BERDASARKAN TIPE HAK
              </div>

              <BarList
                data={tipeHak}
                limit={8}
              />
            </section>

            {/* PENGGUNAAN */}
            <section className="stat-section">
              <div className="stat-section-title">
                BERDASARKAN PENGGUNAAN
              </div>

              <BarList
                data={penggunaan}
                limit={8}
              />
            </section>

          </div>
        )}

      </section>
    </div>
  );
}
