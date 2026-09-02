'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

type Peran = 'pendata' | 'supervisor' | 'pelihat' | 'pengembang';
type Tema = 'terang' | 'gelap';

const PERAN: {
  id: Peran;
  nama: string;
  deskripsi: string;
}[] = [
  {
    id: 'pendata',
    nama: 'PENDATA LAPANGAN',
    deskripsi: 'Input & ubah data bidang, kirim untuk verifikasi',
  },
  {
    id: 'supervisor',
    nama: 'SUPERVISOR',
    deskripsi: 'Periksa, setujui, atau kembalikan bidang',
  },
  {
    id: 'pelihat',
    nama: 'PELIHAT',
    deskripsi: 'Lihat peta & data, tanpa dokumen pribadi',
  },
  {
    id: 'pengembang',
    nama: 'PENGEMBANG',
    deskripsi: 'Akses penuh, kelola layer & pengguna',
  },
];

function FormMasuk() {
  const router = useRouter();
  const kembali = useSearchParams().get('kembali') ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [peran, setPeran] = useState<Peran>('pendata');

  const [tema, setTema] = useState<Tema>('gelap');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
  document.documentElement.dataset.theme =
    tema === 'gelap' ? 'dark' : 'light';
}, [tema]);
function peranNama(id: Peran) {
  return (
    PERAN.find((item) => item.id === id)?.nama ??
    id.toUpperCase()
  );
}
  async function kirim(e: React.FormEvent) {
  e.preventDefault();

  setSibuk(true);
  setGalat(null);

  try {
    const r = await signIn('credentials', {
      username,
      password,
      peran,
      redirect: false,
    });

    if (r?.error) {
      if (r.error.includes('PERAN_TIDAK_SESUAI')) {
        alert(
          `Peran tidak sesuai.\n\nAkun "${username}" terdaftar sebagai ${peranNama(
            peran
          )}.\n\nSilakan pilih peran yang sesuai dengan akun Anda.`
        );

        setGalat(
          'Peran yang dipilih tidak sesuai dengan akun yang terdaftar.'
        );

        return;
      }

      setGalat(
        'Nama pengguna atau kata sandi tidak cocok. Silakan periksa kembali.'
      );

      return;
    }

    router.push(kembali);
    router.refresh();
  } finally {
    setSibuk(false);
  }
}

  return (
    <main className="gate">
      {/* PILIHAN TEMA */}
      <div className="theme-switcher" aria-label="Pilihan tema">
        

        <button
          type="button"
          className={tema === 'terang' ? 'aktif' : ''}
          onClick={() => setTema('terang')}
        >
          TERANG
        </button>

        <button
          type="button"
          className={tema === 'gelap' ? 'aktif' : ''}
          onClick={() => setTema('gelap')}
        >
          GELAP
        </button>
      </div>

      <section className="gate-card">
        <header className="gate-top">
          <div className="kode">
            DPPT / BJN-2026 / TRACE JALAN 19 KM
          </div>

          <h1>
            PENDATAAN BIDANG
            <br />
            TANAH TERDAMPAK
          </h1>

          <p>
           Dokumen Perencanaan Pengadaan Tanah Jalur Lingkar Selatan Kabupaten Bojonegoro
            <br />
          </p>
        </header>

        <form className="gate-body" onSubmit={kirim}>
          {/* USERNAME */}
          <div className="field">
            <label className="lbl" htmlFor="u">
              NAMA PENGGUNA
            </label>

            <input
              id="u"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="field">
            <label className="lbl" htmlFor="p">
              KATA SANDI
            </label>

            <input
              id="p"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ROLE */}
          <div className="field">
            <div className="lbl">
              MASUK SEBAGAI
            </div>

            <div className="role-grid">
              {PERAN.map((item) => {
                const aktif = peran === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`role-card ${aktif ? 'aktif' : ''}`}
                    onClick={() => {
                      setPeran(item.id);
                      setGalat(null);
                    }}
                  >
                    <strong>{item.nama}</strong>
                    <span>{item.deskripsi}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LOGIN */}
          <button
            type="submit"
            className="btn-primary"
            disabled={sibuk}
          >
            {sibuk ? 'MEMERIKSA…' : 'MASUK'}
          </button>

          {galat && (
            <div className="galat" role="alert">
              <strong>PERAN ATAU AKUN TIDAK SESUAI</strong>
              <br />
              Nama pengguna, kata sandi, atau peran yang dipilih
              tidak cocok dengan akun yang terdaftar.
            </div>
          )}
        </form>

        <footer className="gate-foot">
          Gunakan peran sesuai akun yang diberikan kepada Anda.
          <br />
          Hak akses ditentukan oleh peran yang terdaftar di sistem.
        </footer>
      </section>
    </main>
  );
}

/**
 * useSearchParams() memaksa halaman dirender di klien. Tanpa batas Suspense,
 * `next build` gagal saat prerender /login — dan itu menggagalkan deploy.
 */
export default function Masuk() {
  return (
    <Suspense fallback={<main className="gate" />}>
      <FormMasuk />
    </Suspense>
  );
}
