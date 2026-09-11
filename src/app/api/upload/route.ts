import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
// impor client s3 dari file r2.ts Anda — export dulu s3-nya, atau pindahkan fungsi ini ke r2.ts
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.BOJO_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.BOJO_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BOJO_R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const key = form.get("key") as string; // mis. "bidang/191/foto/..."

  if (!file || !key) {
    return NextResponse.json({ error: "file/key kosong" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.BOJO_R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return NextResponse.json({ ok: true, key });
}
