const B2 = require('backblaze-b2');

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

async function authorize() {
  await b2.authorize();
}

async function uploadFile(filename, data) {
  await authorize();

  // Get upload URL
  const uploadUrlResponse = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID,
  });

  // Upload file
  const uploadResponse = await b2.uploadFile({
    uploadUrl: uploadUrlResponse.data.uploadUrl,
    uploadAuthToken: uploadUrlResponse.data.authorizationToken,
    fileName: filename,
    data,
  });

  return uploadResponse.data.fileUrl || uploadResponse.data;
}

module.exports = { uploadFile };
