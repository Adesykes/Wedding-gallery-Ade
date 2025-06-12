import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://wedding-gallery-ade-backend.onrender.com';

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/photos`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setPhotos(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load photos');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/admin/delete/${photoId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        }
      );
      setPhotos((prev) => prev.filter((p) => p._id !== photoId));
    } catch (err) {
      setError('Failed to delete photo');
    }
  };

  const handleDownloadZip = () => {
    const zipUrl = '/api/admin/download-zip';
    window.open(zipUrl, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    if (onLogout) onLogout();
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading photos...</p>;

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Admin Dashboard</h2>

      <button
        onClick={handleLogout}
        style={{
          marginBottom: 20,
          backgroundColor: '#d9534f',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          cursor: 'pointer',
          borderRadius: 6,
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
          fontWeight: 'bold',
        }}
      >
        Logout
      </button>

      <button
        onClick={() => navigate('/')}
        style={{
          marginBottom: 20,
          backgroundColor: '#9CAF88',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          cursor: 'pointer',
          borderRadius: 6,
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
          fontWeight: 'bold',
        }}
      >
        Back to Welcome
      </button>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <p style={{ textAlign: 'center', marginBottom: 20, fontWeight: '600' }}>Total Photos: {photos.length}</p>

      <button
        onClick={handleDownloadZip}
        style={{
          marginBottom: 20,
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '10px 20px',
          cursor: 'pointer',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontWeight: '600',
          fontSize: 14,
        }}
      >
        Download All Photos (ZIP)
      </button>

      {photos.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No photos uploaded yet.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
          }}
        >
          {photos
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((photo) => (
              <div
                key={photo._id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 5,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={photo.url}
                  alt="Uploaded"
                  style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: 6 }}
                />
                <button
                  onClick={() => handleDelete(photo._id)}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    backgroundColor: '#d9534f',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    fontWeight: 'bold',
                    userSelect: 'none',
                  }}
                  title="Delete photo"
                >
                  Delete
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
