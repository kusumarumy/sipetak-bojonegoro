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
    const r = await signIn('credentials', { username, password, redirect: false });
    setSibuk(false);
    // Pesan sengaja tidak menyebut mana yang salah, agar nama pengguna tidak bisa ditebak
    if (r?.error) setGalat('Nama pengguna atau kata sandi tidak cocok. Periksa kembali, atau hubungi pengelola sistem bila lupa.');
    else router.push(kembali);
  }

  return (
    <div className="lg-wrap">
      {/* ---------- kiri ---------- */}
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
          <p>
            Identifikasi, pemetaan, dan pendataan bidang tanah yang terdampak rencana
            pembangunan Jalur Lingkar Selatan — dasar penyusunan Dokumen Perencanaan
            Pengadaan Tanah.
          </p>

          <div className="lg-angka">
            <div><b>19,0 km</b><span>panjang trase</span></div>
            <div><b>26 m</b><span>lebar ROW</span></div>
            <div><b>±950</b><span>bidang terdampak</span></div>
          </div>
        </div>

        <div className="lg-gambar"><Ilustrasi /></div>

        <div className="lg-kaki">
          SIPETAK Bojonegoro · Sistem Informasi Pemetaan Bidang Tanah<br />
          © 2026 Dinas PUBMPR Kabupaten Bojonegoro
        </div>
      </div>

      {/* ---------- kanan ---------- */}
      <div className="lg-kanan">
        <form className="lg-kartu" onSubmit={kirim}>
          <div className="lg-kartu-h">
            <span className="lg-kode">DPPT · BJN-2026</span>
            <h2>Masuk ke sistem</h2>
            <p>Gunakan nama pengguna dan kata sandi yang diberikan pengelola sistem.</p>
          </div>

          <div className="lg-field">
            <label htmlFor="u">Nama pengguna</label>
            <div className="lg-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
              <input id="u" value={username} autoComplete="username" required
                     placeholder="mis. pendata" onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>

          <div className="lg-field">
            <label htmlFor="p">Kata sandi</label>
            <div className="lg-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 018 0v3" />
              </svg>
              <input id="p" type={lihat ? 'text' : 'password'} value={password}
                     autoComplete="current-password" required placeholder="••••••••"
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

          <button className="lg-masuk" disabled={sibuk}>
            {sibuk ? 'Memeriksa…' : 'Masuk'}
          </button>

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
            Akun tidak dapat didaftarkan sendiri. Hak akses ditetapkan sesuai penugasan,
            jadi silakan ajukan permohonan melalui Dinas PUBMPR Kabupaten Bojonegoro atau
            hubungi pengelola sistem di{' '}
            <a href="mailto:sipetak@bojonegorokab.go.id">sipetak@bojonegorokab.go.id</a>.
          </div>

          <div className="lg-aman">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 3l7.5 3v6c0 4.6-3.1 8-7.5 9-4.4-1-7.5-4.4-7.5-9V6z" />
            </svg>
            <span>
              Data bidang tanah dan dokumen pemilik bersifat rahasia. Seluruh aktivitas
              tercatat dalam log sistem.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Latar bergelombang — mengambil bentuk kontur, bukan ornamen acak. */
function Ombak() {
  return (
    <svg className="lg-ombak" viewBox="0 0 800 900" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="#C8D4EE" strokeWidth="1.4" opacity=".65">
        {Array.from({ length: 16 }, (_, i) => {
          const y = 40 + i * 56;
          let d = `M -40 ${y}`;
          for (let x = 0; x <= 840; x += 60)
            d += ` Q ${x + 30} ${y + (i % 2 ? 26 : -26)} ${x + 60} ${y}`;
          return <path key={i} d={d} opacity={i % 4 === 0 ? 0.9 : 0.45} />;
        })}
      </g>
    </svg>
  );
}

/**
 * Ilustrasi: koridor ROW memotong petak-petak bidang tanah.
 * Digambar sendiri, bukan stok — bentuknya persis pekerjaan yang didata sistem ini.
 */
function Ilustrasi() {
  const petak: JSX.Element[] = [];
  let x = 30;
  let i = 0;
  while (x < 545) {
    const w = 26 + ((i * 37) % 30);
    const atas = 26 + ((i * 53) % 46);
    const bawah = 30 + ((i * 71) % 52);
    const kena = (i * 29) % 100;
    const warna = kena > 78 ? '#D9534F' : kena > 55 ? '#E89B62' : kena > 30 ? '#F2C879' : '#A7D8C4';
    petak.push(
      <g key={i}>
        <rect x={x} y={104 - atas} width={w - 3} height={atas} fill={warna} fillOpacity=".62"
              stroke="#5C6B87" strokeWidth=".7" />
        <rect x={x} y={140} width={w - 3} height={bawah} fill={warna} fillOpacity=".62"
              stroke="#5C6B87" strokeWidth=".7" />
      </g>
    );
    x += w;
    i++;
  }

  return (
    <svg viewBox="0 0 570 230" xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="Koridor rencana jalan memotong bidang-bidang tanah">
      {/* petak bidang di kiri dan kanan koridor */}
      {petak}

      {/* koridor ROW 26 m */}
      <rect x="20" y="104" width="530" height="36" fill="#6C4DFF" fillOpacity=".13" />
      <line x1="20" y1="104" x2="550" y2="104" stroke="#6C4DFF" strokeWidth="1.2" strokeDasharray="5 3" />
      <line x1="20" y1="140" x2="550" y2="140" stroke="#6C4DFF" strokeWidth="1.2" strokeDasharray="5 3" />

      {/* as jalan rencana */}
      <line x1="20" y1="122" x2="550" y2="122" stroke="#FFFFFF" strokeWidth="6" />
      <line x1="20" y1="122" x2="550" y2="122" stroke="#4A3AA8" strokeWidth="2.4" />

      {/* patok ukur */}
      {[70, 190, 310, 430].map(px => (
        <g key={px}>
          <line x1={px} y1="96" x2={px} y2="148" stroke="#4A3AA8" strokeWidth="1" opacity=".55" />
          <circle cx={px} cy="122" r="3.4" fill="#FFFFFF" stroke="#4A3AA8" strokeWidth="1.8" />
        </g>
      ))}

      {/* keterangan lebar ROW */}
      <g stroke="#4A3AA8" strokeWidth="1" opacity=".85">
        <line x1="565" y1="104" x2="565" y2="140" />
        <line x1="561" y1="104" x2="569" y2="104" />
        <line x1="561" y1="140" x2="569" y2="140" />
      </g>
      <text x="556" y="126" textAnchor="end" fontSize="9.5" fill="#4A3AA8"
            fontFamily="IBM Plex Mono, monospace" opacity="0">26 m</text>

      {/* label */}
      <text x="22" y="94" fontSize="9.5" fill="#5A6A85" fontFamily="Archivo, sans-serif"
            letterSpacing=".08em">ROW 26 M</text>
      <text x="22" y="176" fontSize="9.5" fill="#5A6A85" fontFamily="Archivo, sans-serif"
            letterSpacing=".08em">BIDANG TANAH TERDAMPAK</text>

      {/* skala warna keterdampakan */}
      <g transform="translate(22,196)">
        <text x="0" y="9" fontSize="8.5" fill="#7A879C" fontFamily="Archivo, sans-serif">Terdampak</text>
        {['#A7D8C4', '#F2C879', '#E89B62', '#D9534F'].map((w, k) => (
          <rect key={w} x={62 + k * 22} y="1" width="20" height="9" fill={w} />
        ))}
        <text x="156" y="9" fontSize="8.5" fill="#7A879C" fontFamily="Archivo, sans-serif">
          &lt;25%  →  ≥70%
        </text>
      </g>
    </svg>
  );
}

/**
 * useSearchParams memaksa render di klien. Tanpa batas Suspense, `next build`
 * gagal saat prerender /login — dan itu menggagalkan deploy.
 */
export default function Masuk() {
  return (
    <Suspense fallback={<div className="lg-wrap" />}>
      <FormMasuk />
    </Suspense>
  );
}
