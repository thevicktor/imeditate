import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;

export const r2Configured =
  Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);

let client = null;
if (r2Configured) {
  client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

/** Key layout: {parentId}/{childId}/{kind}-{timestamp}.{ext} */
export function objectKey(parentId, childId, kind, ext) {
  const safe = String(ext).replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  return `${parentId}/${childId}/${kind}-${Date.now()}.${safe}`;
}

/** Presigned PUT the app uploads bytes to directly (15 min). */
export async function presignedPut(key, contentType) {
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 900 }
  );
  return { url, bucket: R2_BUCKET, key };
}

/** Presigned GET for private reads (1 hour). Stored png_url values are r2://bucket/key. */
export async function presignedGet(key) {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }), { expiresIn: 3600 });
}

export function parseR2Url(url) {
  const m = /^r2:\/\/([^/]+)\/(.+)$/.exec(url ?? "");
  return m ? { bucket: m[1], key: m[2] } : null;
}
