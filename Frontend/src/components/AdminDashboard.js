import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const API_URL = 'https://wedding-gallery-ade-backend.onrender.com';

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('photos'); // Add tab state for switching between photos and wishes
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalGuests: 0,
    totalStorage: '0 MB',
    totalWishes: 0
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
      
      // Update photos-related stats
      setStats(prevStats => ({
        ...prevStats,
        totalPhotos: res.data.length,
        totalGuests: uniqueGuests,
        totalStorage: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
      }));
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load photos');
      setLoading(false);
    }
  };

  const fetchWishes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/wishes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setWishes(res.data);
      
      // Update wishes-related stats
      setStats(prevStats => ({
        ...prevStats,
        totalWishes: res.data.length
      }));
    } catch (err) {
      setError('Failed to load wishes');
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchWishes();
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'photos' && photos.length === 0) {
      fetchPhotos();
    } else if (tab === 'wishes' && wishes.length === 0) {
      fetchWishes();
    }
  };

  const handleDeleteWish = async (wishId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/admin/wishes/${wishId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        }
      );
      setWishes((prev) => prev.filter((w) => w._id !== wishId));
      setStats(prevStats => ({
        ...prevStats,
        totalWishes: prevStats.totalWishes - 1
      }));
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handleDownloadWishes = async () => {
    try {
      // Set loading state
      const downloadingEl = document.createElement('div');
      downloadingEl.className = 'admin-download-toast';
      downloadingEl.textContent = 'Preparing guestbook download...';
      document.body.appendChild(downloadingEl);
      
      // Make request to download wishes
      const response = await axios({
        url: `${API_URL}/api/admin/download-wishes`,
        method: 'GET',
        responseType: 'blob',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('adminToken')}` 
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'wedding-guestbook.csv');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      downloadingEl.textContent = 'Guestbook downloaded successfully!';
      downloadingEl.className = 'admin-download-toast success';
      setTimeout(() => {
        if (document.body.contains(downloadingEl)) {
          document.body.removeChild(downloadingEl);
        }
      }, 3000);
    } catch (err) {
      console.error('Error downloading wishes:', err);
      setError('Failed to download guestbook messages');
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

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photos ({stats.totalPhotos})
        </button>
        <button 
          className={`tab-button ${activeTab === 'wishes' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishes')}
        >
          Guest Book ({stats.totalWishes})
        </button>
      </div>

      {/* Stats Section */}
      <div className="stats-container">
        {activeTab === 'photos' ? (
          <>
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
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-title">Total Messages</div>
              <div className="stat-value">{stats.totalWishes}</div>
            </div>
          </>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Content based on active tab */}
      {activeTab === 'photos' ? (
        <>
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
        </>
      ) : (
        /* Wishes Section */
        <>
          {wishes.length > 0 && (
            <div className="wishes-actions">
              <button 
                className="admin-button admin-button-primary"
                onClick={handleDownloadWishes}
              >
                Download Guestbook
              </button>
            </div>
          )}
          
          <div className="wishes-grid">
            {wishes.length > 0 ? wishes.map((wish) => (
              <div key={wish._id} className="wish-card admin-wish-card">
                <div className="wish-header">
                  <div className="wish-name">{wish.name}</div>
                  <div className="wish-date">
                    {new Date(wish.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="wish-message">{wish.message}</div>
                <div className="wish-actions">
                  <button
                    className="admin-button admin-button-danger"
                    onClick={() => handleDeleteWish(wish._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )) : (
              <div className="empty-state">No guest book messages yet.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
