import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState([]);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get('/api/photos');
      setPhotos(res.data);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post('/api/admin/login', { password });
      if (res.data.success) {
        setAuthed(true);
        fetchPhotos();
      } else {
        alert('Incorrect password');
      }
    } catch {
      alert('Login error');
    }
  };

  const handleDelete = async (url) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await axios.post('/api/admin/delete', { url });
      setPhotos((prev) => prev.filter((p) => p.url !== url));
    } catch {
      alert('Delete failed');
    }
  };

  const handleDownload = async (url) => {
    window.open(url, '_blank');
  };

  const handleDownloadAll = async () => {
    window.open('/api/admin/download-zip', '_blank');
  };

  if (!authed) {
    return (
      <div className="page">
        <h1>Admin Login</h1>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <button onClick={handleDownloadAll}>Download All (ZIP)</button>
      <div className="gallery-grid">
        {photos.map((photo, idx) => (
          <div key={idx} style={{ position: 'relative' }}>
            <img
              src={photo.url}
              className="photo-thumb"
              alt="Upload"
              onClick={() => handleDownload(photo.url)}
            />
            <button
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
              }}
              onClick={() => handleDelete(photo.url)}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
