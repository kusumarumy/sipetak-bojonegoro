import type { Peran, StatusBidang } from '@/types';

/**
 * Semua keputusan hak akses ada di berkas ini — satu tempat, mudah diaudit.
 * Aturan yang sama dipanggil di server (API route) dan di klien (menyembunyikan
 * tombol). Server yang menentukan; klien hanya mengikuti agar UI tidak menipu.
 */
export const dapatMelihatDokumenPribadi = (p: Peran) => p !== 'pelihat';

export const dapatMengubahAtribut = (p: Peran, status: StatusBidang) => {
  if (p === 'pengembang') return true;                       // termasuk memperbaiki data terverifikasi
  if (p === 'pendata') return status === 'draft' || status === 'revisi';
  return false;                                              // supervisor memeriksa, tidak mengetik
};

export const dapatMengirim = (p: Peran, status: StatusBidang) =>
  (p === 'pendata' || p === 'pengembang') && (status === 'draft' || status === 'revisi');

export const dapatMemverifikasi = (p: Peran, status: StatusBidang) =>
  (p === 'supervisor' || p === 'pengembang') && status === 'terkirim';

export const dapatMengelolaPengguna = (p: Peran) => p === 'pengembang';

/** Transisi status yang sah. Apa pun di luar ini ditolak server. */
export const TRANSISI: Record<StatusBidang, StatusBidang[]> = {
  draft:         ['terkirim'],
  revisi:        ['terkirim'],
  terkirim:      ['terverifikasi', 'revisi'],
  terverifikasi: ['revisi']                                  // hanya pengembang, untuk koreksi
};

export function transisiSah(dari: StatusBidang, ke: StatusBidang, p: Peran): boolean {
  if (!TRANSISI[dari]?.includes(ke)) return false;
  if (ke === 'terkirim') return dapatMengirim(p, dari);
  if (dari === 'terverifikasi') return p === 'pengembang';
  return dapatMemverifikasi(p, dari);
}
