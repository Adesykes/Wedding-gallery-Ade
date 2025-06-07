import React, { useEffect, useState } from 'react';

export default function AdminPanel() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetch('/api/photos')
      .then(res => res.json())
      .then(setPhotos)
      .catch(console.error);
  }, []);

  const handleDelete = async (url) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      setPhotos(prev => prev.filter(p => p.url !== url));
    } else {
      alert('Delete failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Panel</h2>
      <button
        onClick={() => window.open('/api/admin/download-zip?token=' + localStorage.getItem('adminToken'), '_blank')}
      >
        Download All as ZIP
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginTop: 20 }}>
        {photos.map(photo => (
          <div key={photo._id} style={{ border: '1px solid #ccc', padding: 5 }}>
            <img src={photo.url} alt="uploaded" style={{ width: '100%' }} />
            <button onClick={() => handleDelete(photo.url)} style={{ marginTop: 5 }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
