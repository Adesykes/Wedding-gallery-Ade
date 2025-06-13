import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const API_URL = 'https://wedding-gallery-ade-backend.onrender.com';

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalGuests: 0,
    totalStorage: '0 MB'
  });

  const fetchPhotos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/photos`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setPhotos(res.data);
      
      // Calculate stats
      const uniqueGuests = new Set(res.data.map(photo => photo.guestId)).size;
      const totalSize = res.data.reduce((acc, photo) => acc + (photo.size || 0), 0);
      setStats({
        totalPhotos: res.data.length,
        totalGuests: uniqueGuests,
        totalStorage: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
      });
      
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
      setSelectedPhotos((prev) => prev.filter(id => id !== photoId));
    } catch (err) {
      setError('Failed to delete photo');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedPhotos.length} photo(s)?`)) return;
    
    try {
      await Promise.all(
        selectedPhotos.map(photoId =>
          axios.delete(`${API_URL}/api/admin/delete/${photoId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          })
        )
      );
      
      setPhotos(prev => prev.filter(p => !selectedPhotos.includes(p._id)));
      setSelectedPhotos([]);
    } catch (err) {
      setError('Failed to delete selected photos');
    }
  };

  const handleSelectPhoto = (photoId) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map(p => p._id));
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1 className="admin-title">Wedding Gallery Admin</h1>
        <div className="admin-controls">
          <button className="admin-button admin-button-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-title">Total Photos</div>
          <div className="stat-value">{stats.totalPhotos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Guests</div>
          <div className="stat-value">{stats.totalGuests}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Storage Used</div>
          <div className="stat-value">{stats.totalStorage}</div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Bulk Actions */}
      {photos.length > 0 && (
        <div className="bulk-actions">
          <button 
            className="admin-button admin-button-secondary"
            onClick={handleSelectAll}
          >
            {selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}
          </button>
          {selectedPhotos.length > 0 && (
            <button 
              className="admin-button admin-button-danger"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({selectedPhotos.length})
            </button>
          )}
        </div>
      )}

      {/* Photos Grid */}
      <div className="photos-grid">
        {photos.map((photo) => (
          <div key={photo._id} className="photo-card">
            <div className="photo-checkbox">
              <input
                type="checkbox"
                checked={selectedPhotos.includes(photo._id)}
                onChange={() => handleSelectPhoto(photo._id)}
              />
            </div>
            <img src={photo.url} alt="Wedding" />
            <div className="photo-info">
              <div className="photo-guest">Guest ID: {photo.guestId}</div>
              <div className="photo-date">
                {new Date(photo.uploadDate).toLocaleDateString()}
              </div>
            </div>
            <div className="photo-actions">
              <button
                className="admin-button admin-button-danger"
                onClick={() => handleDelete(photo._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
