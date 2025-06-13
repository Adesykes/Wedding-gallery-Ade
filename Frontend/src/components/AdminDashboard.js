import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = 'https://wedding-gallery-ade-backend.onrender.com';

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('photos'); // Add tab state for switching between photos and wishes
  const [selectedWish, setSelectedWish] = useState(null); // Added state for viewing wish details
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
      
      // Handle the new response structure with pagination
      const wishesData = res.data.wishes || res.data; // Support both formats
      setWishes(wishesData);
      
      // Update wishes-related stats
      setStats(prevStats => ({
        ...prevStats,
        totalWishes: res.data.pagination ? res.data.pagination.total : wishesData.length
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

  const handleDownloadWishesPDF = async () => {
    try {
      // Set loading state
      const downloadingEl = document.createElement('div');
      downloadingEl.className = 'admin-download-toast';
      downloadingEl.textContent = 'Preparing PDF guestbook...';
      document.body.appendChild(downloadingEl);
      
      // Fetch all wishes if needed (in case we need to get more than what's shown)
      let allWishes = wishes;
      if (wishes.length < stats.totalWishes) {
        const response = await axios.get(`${API_URL}/api/admin/wishes?limit=1000`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        allWishes = response.data.wishes || response.data;
      }
      
      // Create PDF document
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFont('times', 'italic');
      pdf.setFontSize(24);
      pdf.setTextColor(183, 110, 121); // #B76E79
      pdf.text('Jamie & Leanne', pdf.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.text('Wedding Guestbook', pdf.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text('22nd August 2025', pdf.internal.pageSize.getWidth() / 2, 38, { align: 'center' });
      
      // Add date
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdf.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
      
      // Style for header row
      const tableHeaderStyle = {
        fillColor: [183, 110, 121], // #B76E79
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      };
      
      // Create wish entries table
      pdf.autoTable({
        startY: 55,
        head: [['Name', 'Message', 'Date']],
        body: allWishes.map(wish => [
          wish.name,
          wish.message,
          formatDate(wish.createdAt)
        ]),
        headStyles: tableHeaderStyle,
        styles: {
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 40 },  // Name column
          1: { cellWidth: 'auto' }, // Message column (takes remaining space)
          2: { cellWidth: 40 }   // Date column
        },
        margin: { top: 50 },
        didDrawPage: (data) => {
          // Add page number at the bottom
          pdf.setFontSize(10);
          pdf.text(
            `Page ${data.pageNumber} of ${pdf.getNumberOfPages()}`,
            pdf.internal.pageSize.getWidth() / 2, 
            pdf.internal.pageSize.getHeight() - 10, 
            { align: 'center' }
          );
        }
      });
      
      // Add footer with total count
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Total messages: ${allWishes.length}`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
      
      // Save PDF
      pdf.save('jamie-and-leanne-guestbook.pdf');
      
      // Show success message
      downloadingEl.textContent = 'Guestbook PDF downloaded successfully!';
      downloadingEl.className = 'admin-download-toast success';
      setTimeout(() => {
        if (document.body.contains(downloadingEl)) {
          document.body.removeChild(downloadingEl);
        }
      }, 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF guestbook');
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Function to view a wish in full detail
  const handleViewWish = (wish, e) => {
    // Prevent triggering delete when clicking to view
    if (e) {
      e.stopPropagation();
    }
    setSelectedWish(wish);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };
  
  // Function to close the wish detail view
  const handleCloseWishView = () => {
    setSelectedWish(null);
    // Restore scrolling
    document.body.style.overflow = '';
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
              <button 
                className="admin-button admin-button-primary"
                onClick={handleDownloadWishesPDF}
              >
                Download Guestbook as PDF
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

      {/* Wish Detail Modal for Admin */}
      {selectedWish && (
        <div className="wish-modal-overlay" onClick={handleCloseWishView}>
          <div className="wish-modal admin-wish-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCloseWishView}>&times;</button>
            <div className="wish-modal-header">
              <h3 className="wish-modal-name">{selectedWish.name}</h3>
              <div className="wish-modal-date">{formatDate(selectedWish.createdAt)}</div>
            </div>
            <div className="wish-modal-message">
              {selectedWish.message}
            </div>
            <div className="wish-modal-actions">
              <button 
                onClick={() => {
                  handleDeleteWish(selectedWish._id);
                  handleCloseWishView();
                }} 
                className="delete-button"
              >
                Delete Wish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
