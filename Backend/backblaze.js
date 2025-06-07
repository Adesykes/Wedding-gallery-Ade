import dotenv from 'dotenv';
dotenv.config();

import B2 from 'backblaze-b2';
import fs from 'fs';
import path from 'path';

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

async function authorizeB2() {
  await b2.authorize();
  console.log('✅ B2 authorized');
}

async function getUploadUrl(bucketId) {
  const res = await b2.getUploadUrl({ bucketId });
  return res.data;
}

async function uploadFileToB2(localFilePath, b2FileName, bucketId) {
  const fileContents = fs.readFileSync(localFilePath);
  const mime = getMimeType(b2FileName);
  const uploadUrlData = await getUploadUrl(bucketId);

  const uploadRes = await b2.uploadFile({
    uploadUrl: uploadUrlData.uploadUrl,
    uploadAuthToken: uploadUrlData.authorizationToken,
    fileName: b2FileName,
    data: fileContents,
    mime,
  });

  return uploadRes.data;
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

async function getBucketIdByName(bucketName) {
  const result = await b2.listBuckets();
  const bucket = result.data.buckets.find(b => b.bucketName === bucketName);
  if (!bucket) throw new Error(`Bucket "${bucketName}" not found`);
  return bucket.bucketId;
}

export { b2, authorizeB2, uploadFileToB2, getBucketIdByName };


