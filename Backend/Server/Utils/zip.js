const fs = require('fs');
const archiver = require('archiver');
const axios = require('axios');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Temporary folder to store images
const TEMP_DIR = path.join(__dirname, '..', 'temp');

async function createZipFromImageKit() {
  // Ensure temp folder exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }

  const zipName = `photos-${uuidv4()}.zip`;
  const zipPath = path.join(TEMP_DIR, zipName);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise(async (resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ Created ZIP file: ${zipName} (${archive.pointer()} bytes)`);
      resolve(zipPath);
    });

    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    try {
      // You can replace this with your MongoDB or ImageKit fetch
      const photosRes = await axios.get('http://localhost:5000/api/photos');
      const photos = photosRes.data;

      for (const photo of photos) {
        const filename = path.basename(photo.url.split('?')[0]);
        const filePath = path.join(TEMP_DIR, filename);

        const response = await axios.get(photo.url, { responseType: 'arraybuffer' });
        fs.writeFileSync(filePath, response.data);
        archive.file(filePath, { name: filename });
      }

      await archive.finalize();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = createZipFromImageKit;

