import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Gallery.css'; // We’ll create this next

const API_URL = 'https://wedding-gallery-ade-backend.onrender.com';

const GuestGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/photos`)
      .then(res => setPhotos(res.data.reverse())) // newest first
      .catch(err => console.error('Failed to load photos:', err));
  }, []);

  return (
    <div className="gallery-container">
      {photos.map(photo => (
        <div className="gallery-item" key={photo._id} onClick={() => setSelected(photo.url)}>
          <img src={photo.url} alt="guest upload" loading="lazy" />
        </div>
      ))}

      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <img src={selected} alt="Full view" />
        </div>
      )}
    </div>
  );
};

export default GuestGallery;
