// Migration script to update Photo documents with fileId from ImageKit
// Run this script ONCE with: node migrate-add-fileId.js

require('dotenv').config();
const mongoose = require('mongoose');
const Photo = require('./Server/Models/Photo');
const { imagekit } = require('./Server/Utils/imagekit');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wedding-gallery-ade';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Get all photos missing fileId
  const photos = await Photo.find({ $or: [{ fileId: { $exists: false } }, { fileId: null }] });
  if (!photos.length) {
    console.log('No photos to migrate.');
    return;
  }
  console.log(`Found ${photos.length} photos to migrate.`);

  // Get all files from ImageKit (paginated)
  let allFiles = [];
  let skip = 0;
  const limit = 1000;
  let gotAll = false;
  while (!gotAll) {
    const res = await imagekit.listFiles({ skip, limit });
    allFiles = allFiles.concat(res);
    if (res.length < limit) gotAll = true;
    else skip += limit;
  }
  console.log(`Fetched ${allFiles.length} files from ImageKit.`);

  // Map by URL for quick lookup
  const urlToFileId = {};
  allFiles.forEach(f => { urlToFileId[f.url] = f.fileId; });

  let updated = 0;
  for (const photo of photos) {
    const fileId = urlToFileId[photo.url];
    if (fileId) {
      photo.fileId = fileId;
      await photo.save();
      updated++;
      console.log(`Updated photo ${photo._id} with fileId.`);
    } else {
      console.warn(`No fileId found for photo ${photo._id} (url: ${photo.url})`);
    }
  }
  console.log(`Migration complete. Updated ${updated} photos.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
