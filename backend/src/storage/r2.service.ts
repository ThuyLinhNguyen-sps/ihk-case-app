import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload file lên Cloudflare R2
 * @returns key (lưu vào DB)
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return key;
}

/**
 * Download file từ R2
 * Trả về object có Body stream
 */
export async function downloadFromR2(key: string) {
  return r2.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    }),
  );
}

/**
 * Delete file trên R2
 * Dùng khi xoá document / xoá case
 */
export async function deleteFromR2(key: string) {
  if (!key) return;

  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    }),
  );
}
