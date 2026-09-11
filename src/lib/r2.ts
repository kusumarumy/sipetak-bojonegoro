import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _s3: S3Client | null = null;

function s3(): S3Client {
  if (_s3) return _s3;

  const wajib = [
    "BOJO_R2_ACCOUNT_ID",
    "BOJO_R2_ACCESS_KEY_ID",
    "BOJO_R2_SECRET_ACCESS_KEY",
    "BOJO_R2_BUCKET",
  ];

  const kurang = wajib.filter(
    (k) => !process.env[k]
  );

  if (kurang.length) {
    throw new Error(
      `Penyimpanan berkas Bojonegoro belum dikonfigurasi: ${kurang.join(", ")}`
    );
  }

 _s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.BOJO_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.BOJO_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BOJO_R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

  return _s3;
}

const bucket = () =>
  process.env.BOJO_R2_BUCKET!;

export const penyimpananSiap = () =>
  !!(
    process.env.BOJO_R2_ACCOUNT_ID &&
    process.env.BOJO_R2_ACCESS_KEY_ID &&
    process.env.BOJO_R2_SECRET_ACCESS_KEY &&
    process.env.BOJO_R2_BUCKET
  );

export function urlUnggah(
  objectKey: string,
  mime: string,
  detik = 300
) {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: objectKey,
      ContentType: mime,
    }),
    { expiresIn: detik }
  );
}

export function urlBaca(
  objectKey: string,
  detik = 300
) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: objectKey,
    }),
    { expiresIn: detik }
  );
}

export async function hapusObjek(
  objectKey: string
) {
  await s3().send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: objectKey,
    })
  );
}
