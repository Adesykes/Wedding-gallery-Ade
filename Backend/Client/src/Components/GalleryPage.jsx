import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PhotoCard from './PhotoCard';

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const res = await axios.get('/api/photos');
        // Assume each photo has { url, uploadedAt }
        const sorted = res.data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setPhotos(sorted);
      } catch (err) {
        console.error('Failed to load photos:', err);
      }
    }

    fetchPhotos();
  }, []);

  return (
    <div className="page">
      <h1>Wedding Gallery</h1>
      <div className="gallery-grid">
        {photos.map((photo, idx) => (
          <PhotoCard key={idx} url={photo.url} />
        ))}
      </div>
    </div>
  );
}
