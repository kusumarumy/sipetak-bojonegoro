'use client';
import { useEffect, useRef, useState } from 'react';
import { KATEGORI_LABEL, WAJIB, type Bidang, type KategoriLampiran, type Peran } from '@/types';
import { dapatMelihatDokumenPribadi } from '@/lib/rbac';
import { useApp } from '@/store/useApp';

/** Urutan tampil di kartu — mengikuti urutan kerja petugas di lapangan. */
const FOTO: KategoriLampiran[] = [
  'foto_bidang', 'foto_patok', 'foto_bangunan_depan', 'foto_bangunan_kiri',
  'foto_bangunan_kanan', 'foto_bangunan_belakang', 'foto_tanaman',
  'foto_benda_lain', 'foto_akses', 'foto_pemilik_petugas'
];
const DOKUMEN: KategoriLampiran[] = [
  'dok_ktp', 'dok_kk', 'dok_sertipikat', 'dok_sppt', 'dok_ahli_waris',
  'dok_kuasa', 'dok_rekening', 'dok_berita_acara'
];

export default function UnggahBerkas({ bidang, peran, bolehEdit }:
  { bidang: Bidang; peran: Peran; bolehEdit: boolean }) {
  const { muatUlangKartu, beriPesan } = useApp();
  const [sedang, setSedang] = useState<string | null>(null);
  const bolehPribadi = dapatMelihatDokumenPribadi(peran);

  const perKategori = new Map<string, typeof bidang.lampiran[number]>();
  for (const l of bidang.lampiran) if (!perKategori.has(l.kategori)) perKategori.set(l.kategori, l);

  async function unggah(kategori: KategoriLampiran, file: File) {
    setSedang(kategori);
    try {
      const exif = await bacaExif(file);   // koordinat & waktu pengambilan

      const p = await fetch('/api/lampiran/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidang_id: bidang.id, kategori, nama_asli: file.name,
          mime: file.type, ukuran_byte: file.size
        })
      });
      if (!p.ok) throw new Error(await p.text());
      const { url, object_key } = await p.json();

      // Berkas naik langsung ke R2. Tidak lewat server, jadi tidak terbentur
      // batas ukuran badan request.
      const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) throw new Error('Unggahan ke penyimpanan gagal');

      const c = await fetch('/api/lampiran', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidang_id: bidang.id, kategori, object_key, nama_asli: file.name,
          mime: file.type, ukuran_byte: file.size, ...exif
        })
      });
      if (!c.ok) throw new Error(await c.text());

      await muatUlangKartu();
      beriPesan(`${KATEGORI_LABEL[kategori]} tersimpan.`);
    } catch (e: any) {
      beriPesan('Berkas gagal diunggah. ' + e.message);
    } finally { setSedang(null); }
  }

  const kurang = WAJIB.filter(k => !perKategori.has(k));

  return (<>
    <div className="k-sub">Foto lapangan</div>
    <div className="photos">
      {FOTO.map(k => (
        <Ubin key={k} kategori={k} lampiran={perKategori.get(k)} wajib={WAJIB.includes(k)}
              bolehEdit={bolehEdit} bolehPribadi={bolehPribadi}
              sedang={sedang === k} onPilih={(f) => unggah(k, f)} />
      ))}
    </div>

    <div className="k-sub">Dokumen</div>
    <div className="photos">
      {DOKUMEN.map(k => (
        <Ubin key={k} kategori={k} lampiran={perKategori.get(k)} wajib={WAJIB.includes(k)}
              bolehEdit={bolehEdit} bolehPribadi={bolehPribadi}
              sedang={sedang === k} onPilih={(f) => unggah(k, f)} />
      ))}
    </div>

    {kurang.length > 0 && (
      <p className="hint">
        Berkas wajib yang belum ada: {kurang.map(k => KATEGORI_LABEL[k]).join(', ')}.
        Bidang belum bisa dikirim untuk verifikasi sebelum semuanya lengkap.
      </p>
    )}
    <p className="hint">
      Setiap berkas menyimpan koordinat, waktu pengambilan, dan petugas. Berkas dibuka lewat
      tautan bertanda tangan yang kedaluwarsa dalam 5 menit, bukan URL publik.
    </p>
  </>);
}

function Ubin({
  kategori,
  lampiran,
  wajib,
  bolehEdit,
  bolehPribadi,
  sedang,
  onPilih,
}: {
  kategori: KategoriLampiran;
  lampiran?: Bidang['lampiran'][number];
  wajib: boolean;
  bolehEdit: boolean;
  bolehPribadi: boolean;
  sedang: boolean;
  onPilih: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const terkunci = lampiran?.sensitif && !bolehPribadi;

  // URL baca diminta saat ubin tampil, lalu kedaluwarsa sendiri.
  useEffect(() => {
    let batal = false;
    if (lampiran && !terkunci) {
      fetch(`/api/lampiran/${lampiran.id}`).then(r => r.json())
        .then(j => { if (!batal) setSrc(j.url); }).catch(() => {});
    } else setSrc(null);
    return () => { batal = true; };
  }, [lampiran?.id, terkunci]);

  const ada = !!lampiran;
  return (
    <div className={'ph-tile' + (ada ? '' : ' empty')}
         onClick={() => bolehEdit && !ada && input.current?.click()}
         style={{ cursor: bolehEdit && !ada ? 'pointer' : 'default' }}>
      {src && <img src={src} alt={KATEGORI_LABEL[kategori]} />}
      {terkunci && <div className="lock">Dokumen pribadi<br />tidak dibuka untuk peran ini</div>}
      <div className="cap">
        <div className="t">{KATEGORI_LABEL[kategori]}{wajib && !ada ? ' *' : ''}</div>
        <div className="m">
          {sedang ? 'Mengunggah…'
            : ada ? <>
                <div className="m">
  {sedang ? 'Mengunggah…'
    : ada ? <>
        {lampiran.lat != null && lampiran.lon != null
          ? `${lampiran.lat.toFixed(5)} / ${lampiran.lon.toFixed(5)}`
          : 'tanpa koordinat'}<br />
        {lampiran.diambil_pada ? new Date(lampiran.diambil_pada).toLocaleString('id-ID') : '—'}
      </>
    : bolehEdit ? 'ketuk untuk unggah' : 'belum ada'}
</div>
                {lampiran.diambil_pada ? new Date(lampiran.diambil_pada).toLocaleString('id-ID') : '—'}
              </>
            : bolehEdit ? 'ketuk untuk unggah' : 'belum ada'}
        </div>
      </div>
      <input ref={input} type="file" hidden accept="image/*,application/pdf"
             onChange={(e) => { const f = e.target.files?.[0]; if (f) onPilih(f); e.target.value = ''; }} />
    </div>
  );
}

/**
 * Membaca koordinat & waktu dari EXIF secara langsung, tanpa pustaka tambahan.
 * Kalau kelak butuh lebih banyak tag, ganti dengan exifr.
 */
async function bacaExif(file: File): Promise<{ lat?: number; lon?: number; diambil_pada?: string }> {
  if (!file.type.startsWith('image/')) return {};
  try {
    const buf = await file.slice(0, 128 * 1024).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return {};
    let off = 2;
    while (off < v.byteLength - 4) {
      if (v.getUint16(off) === 0xFFE1) {
        const tiff = off + 10;
        const le = v.getUint16(tiff) === 0x4949;
        const u16 = (p: number) => v.getUint16(p, le);
        const u32 = (p: number) => v.getUint32(p, le);
        const rasio = (p: number) => u32(p) / u32(p + 4);
        const dms = (p: number) => rasio(p) + rasio(p + 8) / 60 + rasio(p + 16) / 3600;

        let ifd = tiff + u32(tiff + 4), gpsOff = 0, waktu = '';
        for (let i = 0; i < u16(ifd); i++) {
          const e = ifd + 2 + i * 12, tag = u16(e);
          if (tag === 0x8825) gpsOff = tiff + u32(e + 8);
          if (tag === 0x8769) {
            const ex = tiff + u32(e + 8);
            for (let j = 0; j < u16(ex); j++) {
              const f = ex + 2 + j * 12;
              if (u16(f) === 0x9003) {
                const p = tiff + u32(f + 8);
                waktu = new TextDecoder().decode(new Uint8Array(buf, p, 19));
              }
            }
          }
        }
        const hasil: any = {};
        if (waktu) {
          const [d, t] = waktu.split(' ');
          hasil.diambil_pada = new Date(`${d.replace(/:/g, '-')}T${t}`).toISOString();
        }
        if (gpsOff) {
          let lat = 0, lon = 0, nS = 'N', eW = 'E';
          for (let i = 0; i < u16(gpsOff); i++) {
            const e = gpsOff + 2 + i * 12, tag = u16(e);
            if (tag === 1) nS = String.fromCharCode(v.getUint8(e + 8));
            if (tag === 2) lat = dms(tiff + u32(e + 8));
            if (tag === 3) eW = String.fromCharCode(v.getUint8(e + 8));
            if (tag === 4) lon = dms(tiff + u32(e + 8));
          }
          if (lat) { hasil.lat = nS === 'S' ? -lat : lat; hasil.lon = eW === 'W' ? -lon : lon; }
        }
        return hasil;
      }
      off += 2 + v.getUint16(off + 2);
    }
  } catch { /* foto tanpa EXIF tetap boleh diunggah */ }
  return {};
}
