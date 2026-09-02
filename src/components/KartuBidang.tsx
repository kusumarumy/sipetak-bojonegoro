'use client';
import { useState } from 'react';
import { useApp } from '@/store/useApp';
import { dapatMengubahAtribut, dapatMengirim, dapatMemverifikasi, dapatMelihatDokumenPribadi } from '@/lib/rbac';
import { STATUS_LABEL, STATUS_WARNA, KATEGORI_LABEL, WAJIB,
         type Peran, type Bidang, type KategoriLampiran } from '@/types';
import UnggahBerkas from './UnggahBerkas';

const TABS = [
  ['ringkas', 'Ringkasan'], ['pemilik', 'Pemilik'], ['bidang', 'Bidang'],
  ['bangunan', 'Bangunan'], ['tanaman', 'Tanaman'], ['dokumen', 'Foto & dokumen'], ['riwayat', 'Riwayat']
] as const;
type Tab = typeof TABS[number][0];

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('id-ID');
const tgl = (s: string | null) => s ? new Date(s).toLocaleDateString('id-ID') : '—';

export default function KartuBidang({ peran }: { peran: Peran }) {
  const { kartu, memuatKartu, pilihBidang, muatUlangKartu, beriPesan } = useApp();
  const [tab, setTab] = useState<Tab>('ringkas');
  const [edit, setEdit] = useState(false);
  const [draf, setDraf] = useState<Record<string, any>>({});
  const [sibuk, setSibuk] = useState(false);

  const b = kartu;
  const bolehEdit = b ? dapatMengubahAtribut(peran, b.status) : false;

  async function simpan() {
    if (!b) return;
    setSibuk(true);
    try {
      const r = await fetch(`/api/bidang/${b.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draf)
      });
      if (!r.ok) throw new Error(await r.text());
      setEdit(false); setDraf({});
      await muatUlangKartu();
      beriPesan(`Perubahan tersimpan pada ${b.kode}.`);
    } catch (e: any) { beriPesan('Gagal menyimpan. ' + e.message); }
    finally { setSibuk(false); }
  }

  async function pindahStatus(ke: string, catatan?: string) {
    if (!b) return;
    setSibuk(true);
    try {
      const r = await fetch(`/api/bidang/${b.id}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ke, catatan })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        // Pesan galat menyebutkan berkas apa yang kurang, bukan sekadar "gagal"
        const kurang = j.kurang?.map((k: KategoriLampiran) => KATEGORI_LABEL[k]).join(', ');
        throw new Error(kurang ? `${j.pesan} Belum ada: ${kurang}.` : (j.pesan ?? 'Permintaan ditolak'));
      }
      await muatUlangKartu();
      beriPesan(ke === 'terkirim' ? `Bidang ${b.kode} dikirim untuk verifikasi.`
        : ke === 'terverifikasi' ? `Bidang ${b.kode} disetujui.`
        : `Bidang ${b.kode} dikembalikan untuk revisi.`);
    } catch (e: any) { beriPesan(e.message); }
    finally { setSibuk(false); }
  }

  if (!b) return <aside className="kartu" aria-hidden />;

  const nilai = (k: keyof Bidang) => (k in draf ? draf[k] : (b as any)[k]);
  const set = (k: string, v: any) => setDraf(d => ({ ...d, [k]: v }));

  const dd = (l: string, v: any, cls = '') => (<><dt>{l}</dt><dd className={cls}>{v ?? '—'}</dd></>);
  const ed = (l: string, k: string, cls = '', angka = false) => edit
    ? (<><dt>{l}</dt><dd><input value={nilai(k as any) ?? ''}
        onChange={(e) => set(k, angka ? Number(e.target.value.replace(/[^\d.]/g, '')) : e.target.value)} /></dd></>)
    : dd(l, angka ? fmt(nilai(k as any)) : nilai(k as any), cls);

  const utama = b.pemilik[0];

  return (
    <aside className="kartu open" aria-label="Kartu bidang">
      <div className="k-top">
        <button className="k-close" aria-label="Tutup" onClick={() => pilihBidang(null)}>×</button>
        <div className="k-eyebrow">Kartu bidang tanah</div>
        <div className="k-id">{b.kode}</div>
        <div className="k-nm">{utama?.nama ?? 'Pemilik belum didata'}</div>
        <Stempel status={b.status} tanggal={b.diverifikasi_pada} />
      </div>

      <div className="k-tabs" role="tablist">
        {TABS.map(([k, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k as Tab)}>{n}</button>
        ))}
      </div>

      <div className="k-body">
        {memuatKartu && <p className="hint">Memuat kartu…</p>}

        {tab === 'ringkas' && (<>
          <dl className="dl">
            {dd('Nomor bidang', b.kode, 'num')}
            {dd('Desa / kec.', [b.desa, b.kecamatan].filter(Boolean).join(' / '))}
            {dd('Luas bidang', fmt(b.luas_m2) + ' m²', 'num')}
            {dd('Terdampak ROW', `${fmt(b.luas_terdampak_m2)} m² (${b.luas_m2 ? Math.round((b.luas_terdampak_m2 ?? 0) / b.luas_m2 * 100) : 0}%)`, 'num')}
            {dd('Sisa bidang', fmt(b.luas_sisa_m2) + ' m²', 'num')}
            {dd('Penggunaan', b.penggunaan)}
            {dd('Bangunan', b.bangunan.length ? `${b.bangunan[0].jenis} · ${fmt(b.bangunan[0].luas_lantai_m2)} m²` : 'Tidak ada')}
            {dd('Tanaman', b.tanaman.length ? `${b.tanaman.length} jenis` : 'Tidak ada')}
            {dd('Petugas', b.petugas_nama)}
            {dd('Tanggal ukur', tgl(b.tanggal_ukur), 'num')}
            {dd('Status', <span className="pill" style={{ color: STATUS_WARNA[b.status] }}>{STATUS_LABEL[b.status]}</span>)}
          </dl>
          {b.catatan_supervisor && b.status === 'revisi' && (<>
            <div className="k-sub">Catatan supervisor</div>
            <div className="callout">{b.catatan_supervisor}</div>
          </>)}
        </>)}

        {tab === 'pemilik' && (<>
          <dl className="dl">
            {ed('Nama pemilik', 'pemilik_nama', 'nm')}
            {dapatMelihatDokumenPribadi(peran)
              ? dd('NIK', utama?.nik, 'num')
              : dd('NIK', <span style={{ color: 'var(--pdim)', fontSize: 12 }}>Disembunyikan untuk peran ini</span>)}
            {dd('Alamat', utama?.alamat)}
            {dd('Telepon', utama?.telepon, 'num')}
            {dd('Pekerjaan', utama?.pekerjaan)}
            {dd('Hubungan', utama?.hubungan)}
            {dd('Alas hak', b.alas_hak)}
          </dl>
          {b.pemilik.length > 1 && (<>
            <div className="k-sub">Pemilik lain</div>
            <dl className="dl">{b.pemilik.slice(1).map(p => (
              <span key={p.id} style={{ display: 'contents' }}>{dd(p.hubungan ?? 'Pemilik', p.nama, 'nm')}</span>))}
            </dl>
          </>)}
        </>)}

        {tab === 'bidang' && (
          <dl className="dl">
            {ed('Luas bidang (m²)', 'luas_m2', 'num', true)}
            {ed('Terdampak (m²)', 'luas_terdampak_m2', 'num', true)}
            {dd('Sisa (m²)', fmt(b.luas_sisa_m2), 'num')}
            {ed('Alas hak', 'alas_hak')}
            {dd('NIB', b.nib, 'num')}
            {ed('Penggunaan', 'penggunaan')}
            {dd('NJOP / m²', b.njop_m2 ? 'Rp ' + fmt(b.njop_m2) : '—', 'num')}
            {ed('Batas utara', 'batas_utara')}
            {ed('Batas selatan', 'batas_selatan')}
            {ed('Batas timur', 'batas_timur')}
            {ed('Batas barat', 'batas_barat')}
          </dl>
        )}

        {tab === 'bangunan' && (b.bangunan.length ? b.bangunan.map(g => (
          <dl className="dl" key={g.id}>
            {dd('Jenis', g.jenis)}{dd('Konstruksi', g.konstruksi)}
            {dd('Luas lantai', fmt(g.luas_lantai_m2) + ' m²', 'num')}
            {dd('Jumlah lantai', g.jumlah_lantai, 'num')}
            {dd('Atap', g.atap)}{dd('Dinding', g.dinding)}
            {dd('Tahun dibangun', g.tahun_dibangun, 'num')}{dd('Kondisi', g.kondisi)}
            {dd('Terdampak', g.tingkat_terdampak)}
            {dd('Listrik', g.listrik)}{dd('Air', g.air)}{dd('Sanitasi', g.sanitasi)}
          </dl>
        )) : <div className="callout" style={{ borderColor: 'var(--paper-line)' }}>Tidak ada bangunan di atas bidang ini.</div>)}

        {tab === 'tanaman' && (<>
          <div className="k-sub">Tanaman tumbuh</div>
          {b.tanaman.length
            ? <dl className="dl">{b.tanaman.map(t => (
                <span key={t.id} style={{ display: 'contents' }}>
                  {dd(t.jenis, `${fmt(t.jumlah)} ${t.satuan ?? 'batang'} · ${t.keterangan ?? '—'}`)}
                </span>))}</dl>
            : <p className="hint">Belum ada tanaman yang didata.</p>}
          <div className="k-sub">Benda lain di atas tanah</div>
          {b.benda_lain.length
            ? <dl className="dl">{b.benda_lain.map(x => (
                <span key={x.id} style={{ display: 'contents' }}>
                  {dd(x.jenis, [x.ukuran, x.jumlah ? `${x.jumlah} unit` : null].filter(Boolean).join(' · '))}
                </span>))}</dl>
            : <p className="hint">Belum ada benda lain yang didata.</p>}
        </>)}

        {tab === 'dokumen' && <UnggahBerkas bidang={b} peran={peran} bolehEdit={bolehEdit} />}

        {tab === 'riwayat' && (
          <ul className="log">
            {b.riwayat.map(r => (
              <li key={r.id}>
                <span className="dot" />
                <div>
                  <div className="lt">{deskripsiJejak(r)}</div>
                  <div className="lm">{new Date(r.pada).toLocaleString('id-ID')} · {r.oleh ?? 'sistem'}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="k-foot">
        {edit ? (<>
          <button className="k-act" disabled={sibuk} onClick={simpan}>Simpan perubahan</button>
          <button className="k-act alt" onClick={() => { setEdit(false); setDraf({}); }}>Batal</button>
        </>) : (<>
          {bolehEdit && <button className="k-act alt" onClick={() => setEdit(true)}>Ubah data</button>}
          {dapatMengirim(peran, b.status) &&
            <button className="k-act" disabled={sibuk} onClick={() => pindahStatus('terkirim')}>Kirim untuk verifikasi</button>}
          {dapatMemverifikasi(peran, b.status) && (<>
            <button className="k-act" disabled={sibuk} onClick={() => pindahStatus('terverifikasi')}>Setujui</button>
            <button className="k-act alt" disabled={sibuk} onClick={() => {
              const c = prompt('Apa yang perlu diperbaiki pendata?');
              if (c?.trim()) pindahStatus('revisi', c.trim());
            }}>Kembalikan</button>
          </>)}
          {peran === 'pendata' && !bolehEdit &&
            <div className="k-note">Bidang sudah dikirim, jadi terkunci untuk pendata. Supervisor bisa mengembalikannya untuk revisi.</div>}
          {peran === 'pelihat' &&
            <div className="k-note">Peran pelihat hanya membaca. Perubahan data dilakukan oleh pendata dan supervisor.</div>}
        </>)}
      </div>
    </aside>
  );
}

function Stempel({ status, tanggal }: { status: Bidang['status']; tanggal: string | null }) {
  const t: Record<string, [string, string]> = {
    draft: ['Draft', 'belum dikirim'],
    terkirim: ['Diperiksa', 'menunggu supervisor'],
    terverifikasi: ['Terverifikasi', tanggal ? new Date(tanggal).toLocaleDateString('id-ID') : ''],
    revisi: ['Revisi', 'kembali ke pendata']
  };
  const [s1, s2] = t[status];
  return (
    <div className="stamp" style={{ color: STATUS_WARNA[status] }}>
      <div className="s1">{s1}</div><div className="s2">{s2}</div>
    </div>
  );
}

/** Baris audit mentah diterjemahkan jadi kalimat yang bisa dibaca orang. */
function deskripsiJejak(r: { aksi: string; kolom: string | null; nilai_lama: string | null; nilai_baru: string | null }) {
  if (r.aksi === 'insert') return 'Bidang dibuat';
  if (r.aksi === 'status') {
    const label: Record<string, string> = {
      terkirim: 'Dikirim untuk verifikasi', terverifikasi: 'Disetujui supervisor',
      revisi: 'Dikembalikan untuk revisi', draft: 'Dikembalikan ke draft'
    };
    return label[r.nilai_baru ?? ''] ?? 'Status diubah';
  }
  return `${(r.kolom ?? '').replace(/_/g, ' ')}: ${r.nilai_lama ?? '(kosong)'} → ${r.nilai_baru ?? '(kosong)'}`;
}
