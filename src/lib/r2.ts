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

  const accountId = process.env.BOJO_R2_ACCOUNT_ID;
  const accessKeyId = process.env.BOJO_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BOJO_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.BOJO_R2_BUCKET;

  const kurang: string[] = [];

  if (!accountId) kurang.push("BOJO_R2_ACCOUNT_ID");
  if (!accessKeyId) kurang.push("BOJO_R2_ACCESS_KEY_ID");
  if (!secretAccessKey) kurang.push("BOJO_R2_SECRET_ACCESS_KEY");
  if (!bucketName) kurang.push("BOJO_R2_BUCKET");

  if (kurang.length > 0) {
    throw new Error(
      `Penyimpanan berkas Bojonegoro belum dikonfigurasi: ${kurang.join(", ")}`
    );
  }

  console.log("R2 CONFIG CHECK", {
    account: accountId,
    bucket: bucketName,
    accessKeyConfigured: !!accessKeyId,
    secretKeyConfigured: !!secretAccessKey,
  });

  _s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });

  return _s3;
}

function bucket(): string {
  const name = process.env.BOJO_R2_BUCKET;

  if (!name) {
    throw new Error("BOJO_R2_BUCKET belum dikonfigurasi");
  }

  return name;
}

export const penyimpananSiap = (): boolean => {
  return !!(
    process.env.BOJO_R2_ACCOUNT_ID &&
    process.env.BOJO_R2_ACCESS_KEY_ID &&
    process.env.BOJO_R2_SECRET_ACCESS_KEY &&
    process.env.BOJO_R2_BUCKET
  );
};

export async function unggahObjek(
  objectKey: string,
  body: Buffer | Uint8Array,
  mime: string
) {
  console.log("R2 UPLOAD START", {
    objectKey,
    mime,
    size: body.length,
  });

  try {
    const result = await s3().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: objectKey,
        Body: body,
        ContentType: mime,
      })
    );

    console.log("R2 UPLOAD SUCCESS", {
      objectKey,
      etag: result.ETag,
    });

    return result;
  } catch (error: any) {
    console.error("R2 UPLOAD FAILED", {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      statusCode: error?.$metadata?.httpStatusCode,
      requestId: error?.$metadata?.requestId,
      extendedRequestId: error?.$metadata?.extendedRequestId,
    });

    throw error;
  }
}

export async function urlUnggah(
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
    {
      expiresIn: detik,
    }
  );
}

export async function urlBaca(
  objectKey: string,
  detik = 300
) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: objectKey,
    }),
    {
      expiresIn: detik,
    }
  );
}
export async function hapusObjek(objectKey: string) {
  console.log("R2 DELETE START", {
    objectKey,
  });

  try {
    const result = await s3().send(
      new DeleteObjectCommand({
        Bucket: bucket(),
        Key: objectKey,
      })
    );

    console.log("R2 DELETE SUCCESS", {
      objectKey,
    });

    return result;
  } catch (error: any) {
    console.error("R2 DELETE FAILED", {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      statusCode: error?.$metadata?.httpStatusCode,
      requestId: error?.$metadata?.requestId,
      extendedRequestId: error?.$metadata?.extendedRequestId,
    });

    throw error;
  }
}
