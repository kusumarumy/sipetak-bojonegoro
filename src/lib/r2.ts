import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _s3: S3Client | null = null;

/**
 * Klien dibuat saat pertama dipakai, bukan saat modul diimpor. Dengan begitu
 * aplikasi tetap jalan walau kredensial R2 belum diisi — hanya fitur unggah
 * berkas yang belum aktif, peta dan data bidang tidak terganggu.
 */
function s3(): S3Client {
  if (_s3) return _s3;
  const wajib = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
  const kurang = wajib.filter(k => !process.env[k]);
  if (kurang.length)
    throw new Error(`Penyimpanan berkas belum dikonfigurasi. Isi dulu di .env: ${kurang.join(', ')}`);

  _s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
    }
  });
  return _s3;
}

const bucket = () => process.env.R2_BUCKET!;

/** Benar bila unggah berkas sudah bisa dipakai. */
export const penyimpananSiap = () =>
  !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
     process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET);

/**
 * URL unggah langsung dari peramban ke R2. Berkas tidak melewati server Next.js
 * — Vercel membatasi badan request sekitar 4,5 MB, sedangkan foto lapangan bisa
 * jauh lebih besar.
 */
export function urlUnggah(objectKey: string, mime: string, detik = 300) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: objectKey, ContentType: mime }), { expiresIn: detik });
}

/** URL baca berumur pendek. Bucket lampiran tetap privat. */
export function urlBaca(objectKey: string, detik = 300) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: objectKey }), { expiresIn: detik });
}

export async function hapusObjek(objectKey: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: objectKey }));
}

/** bidang/BJN-0001/dok_ktp/1724832000-a1b2c3.jpg */
export function susunKunci(kodeBidang: string, kategori: string, namaAsli: string) {
  const ext = (namaAsli.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const acak = Math.random().toString(36).slice(2, 8);
  return `bidang/${kodeBidang}/${kategori}/${Date.now()}-${acak}.${ext}`;
}
