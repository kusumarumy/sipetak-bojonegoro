import type { Peran, StatusBidang } from '@/types';

export const dapatMelihatDokumenPribadi = (p: Peran) =>
  p !== 'pelihat';

export const dapatMengubahAtribut = (
  p: Peran,
  status: StatusBidang
) => {
  // Pengembang bisa edit semua status
  if (p === 'pengembang') return true;

  // Pendata hanya bisa edit draft/revisi
  if (p === 'pendata') {
    return status === 'draft' || status === 'revisi';
  }

  return false;
};

export const dapatMengirim = (
  p: Peran,
  status: StatusBidang
) =>
  (p === 'pendata' || p === 'pengembang') &&
  (status === 'draft' || status === 'revisi');

export const dapatMemverifikasi = (
  p: Peran,
  status: StatusBidang
) =>
  (p === 'supervisor' || p === 'pengembang') &&
  status === 'terkirim';

export const dapatMengelolaPengguna = (p: Peran) =>
  p === 'pengembang';

export const TRANSISI: Record<StatusBidang, StatusBidang[]> = {
  draft: ['terkirim'],
  revisi: ['terkirim'],
  terkirim: ['terverifikasi', 'revisi'],
  terverifikasi: ['revisi'],
};

export function transisiSah(
  dari: StatusBidang,
  ke: StatusBidang,
  p: Peran
): boolean {
  if (!TRANSISI[dari]?.includes(ke)) return false;

  // Pendata dan pengembang bisa mengirim
  if (ke === 'terkirim') {
    return dapatMengirim(p, dari);
  }

  // Pengembang bisa melakukan semua evaluasi
  if (dari === 'terverifikasi') {
    return p === 'pengembang';
  }

  return dapatMemverifikasi(p, dari);
}
