// Utility for ImageKit operations
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Delete a file from ImageKit by fileId
 * @param {string} fileId
 * @returns {Promise}
 */
function deleteImageKitFile(fileId) {
  return imagekit.deleteFile(fileId);
}

module.exports = { imagekit, deleteImageKitFile };
