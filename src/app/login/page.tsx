'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function FormMasuk() {
  const router = useRouter();
  const kembali = useSearchParams().get('kembali') ?? '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lihat, setLihat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true); setGalat(null);
    try {
      const r = await signIn('credentials', { username, password, redirect: false });
      // Pesan tidak menyebut mana yang salah, agar nama pengguna tidak bisa ditebak
      if (r?.error) { setGalat('Nama pengguna atau kata sandi tidak cocok.'); return; }
      router.push(kembali);
      router.refresh();
    } finally { setSibuk(false); }
  }

  return (
    <div className="lg-wrap">
      {/* ---------- kiri: identitas & ilustrasi ---------- */}
      <div className="lg-kiri">
        <Ombak />

        <div className="lg-brand">
          <img src="https://bojonegorokab.go.id/portal/assets/img/logo-kabupaten.png"
               alt="Logo Kabupaten Bojonegoro" />
          <div>
            <b>Dinas Pekerjaan Umum Bina Marga<br />dan Perumahan Rakyat</b>
            <span>Kabupaten Bojonegoro</span>
          </div>
        </div>

        <div className="lg-hero">
          <h1>Pendataan bidang tanah<br /><em>terdampak trase jalan</em></h1>
          <p>Jalur Lingkar Selatan Kabupaten Bojonegoro</p>
          <div className="lg-angka">
            <div><b>19,0 km</b><span>panjang trase</span></div>
            <div><b>26 m</b><span>lebar ROW</span></div>
            <div><b>±950</b><span>bidang terdampak</span></div>
          </div>
        </div>

        <Ilustrasi />
        <div className="lg-kaki">© 2026 Dinas PUBMPR Kabupaten Bojonegoro</div>
      </div>

      {/* ---------- kanan: kartu mengambang ---------- */}
      <div className="lg-kanan">
        <form className="lg-kartu" onSubmit={kirim}>
          <span className="lg-kode">DPPT · BJN-2026</span>
          <h2>Masuk ke sistem</h2>
          <p className="lg-sub">Gunakan akun yang diberikan pengelola sistem.</p>

          <div className="lg-field">
            <label htmlFor="u">Nama pengguna</label>
            <div className="lg-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
              <input id="u" value={username} autoComplete="username" required
                     onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>

          <div className="lg-field">
            <label htmlFor="p">Kata sandi</label>
            <div className="lg-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 018 0v3" />
              </svg>
              <input id="p" type={lihat ? 'text' : 'password'} value={password}
                     autoComplete="current-password" required
                     onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="lg-lihat" onClick={() => setLihat(v => !v)}
                      aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                {lihat ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8" />
                    <path d="M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4.5 9 7 0 .9-.9 2.3-2.4 3.6M6.3 6.7C4 8.2 3 10.2 3 12c0 2 4 7 9 7 1.2 0 2.3-.2 3.3-.6" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" /><circle cx="12" cy="12" r="2.6" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button className="lg-masuk" disabled={sibuk}>{sibuk ? 'Memeriksa…' : 'Masuk'}</button>

          {galat && (
            <div className="lg-galat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16.2v.1" />
              </svg>
              <span>{galat}</span>
            </div>
          )}

          {/* Tidak ada pendaftaran mandiri — akun dibuat pengelola sistem */}
          <div className="lg-info">
            <b>Belum punya akun?</b>
            Akun dibuat oleh pengelola sistem sesuai penugasan.{' '}
            <a href="mailto:dppt@bojonegorokab.go.id">dppt@bojonegorokab.go.id</a>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Latar bergelombang — bentuknya garis kontur, bukan ornamen acak. */
function Ombak() {
  return (
    <svg className="lg-ombak" viewBox="0 0 800 900" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="#C6D2EC" strokeWidth="1.3">
        {Array.from({ length: 15 }, (_, i) => {
          const y = 46 + i * 60;
          let d = `M -40 ${y}`;
          for (let x = 0; x <= 840; x += 70)
            d += ` Q ${x + 35} ${y + (i % 2 ? 24 : -24)} ${x + 70} ${y}`;
          return <path key={i} d={d} opacity={i % 4 === 0 ? 0.75 : 0.4} />;
        })}
      </g>
    </svg>
  );
}

/**
 * Penampang atas: koridor ROW memotong deretan bidang tanah, diwarnai menurut
 * seberapa besar bagian yang terkena. Digambar sendiri, bukan stok — bentuknya
 * persis pekerjaan yang didata sistem ini.
 */
function Ilustrasi() {
  const WARNA = ['#A9D9C6', '#A9D9C6', '#BFE0CD', '#F0CE8E', '#F0CE8E', '#E9A97C', '#D8756F'];
  const petak = [];
  let x = 8;
  for (let i = 0; x < 660; i++) {
    const w = 24 + ((i * 17) % 12);
    const atas = 46 + ((i * 23) % 34);
    const bawah = 50 + ((i * 31) % 38);
    const c = WARNA[(i * 5) % WARNA.length];
    petak.push(
      <g key={i}>
        <rect x={x} y={116 - atas} width={w - 2.5} height={atas} rx="1.5"
              fill={c} fillOpacity=".72" stroke="#7C8CA8" strokeWidth=".6" />
        <rect x={x} y={150} width={w - 2.5} height={bawah} rx="1.5"
              fill={c} fillOpacity=".72" stroke="#7C8CA8" strokeWidth=".6" />
      </g>
    );
    x += w;
  }

  return (
    <div className="lg-gambar">
      <svg viewBox="0 0 660 240" xmlns="http://www.w3.org/2000/svg" role="img"
           aria-label="Koridor rencana jalan memotong bidang-bidang tanah">
        {petak}
        <rect x="0" y="116" width="660" height="34" fill="#6C4DFF" fillOpacity=".12" />
        <line x1="0" y1="116" x2="660" y2="116" stroke="#6C4DFF" strokeWidth="1.1" strokeDasharray="6 4" opacity=".8" />
        <line x1="0" y1="150" x2="660" y2="150" stroke="#6C4DFF" strokeWidth="1.1" strokeDasharray="6 4" opacity=".8" />
        <line x1="0" y1="133" x2="660" y2="133" stroke="#FFFFFF" strokeWidth="6.5" />
        <line x1="0" y1="133" x2="660" y2="133" stroke="#4A3AA8" strokeWidth="2.2" />
        {[92, 232, 372, 512].map(px => (
          <circle key={px} cx={px} cy="133" r="3.6" fill="#FFFFFF" stroke="#4A3AA8" strokeWidth="1.8" />
        ))}
      </svg>
    </div>
  );
}

export default function Masuk() {
  return (
    <Suspense fallback={<div className="lg-wrap" />}>
      <FormMasuk />
    </Suspense>
  );
}
