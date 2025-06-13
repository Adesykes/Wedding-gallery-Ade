import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { jsPDF } from 'jspdf';
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
  };  const handleDownloadWishesPDF = async () => {
    try {
      // Set loading state
      const downloadingEl = document.createElement('div');
      downloadingEl.className = 'admin-download-toast';
      downloadingEl.textContent = 'Preparing PDF guestbook...';
      document.body.appendChild(downloadingEl);
      
      // Fetch all wishes if needed (in case we need to get more than what's shown)
      let allWishes = wishes;
      try {
        if (wishes.length < stats.totalWishes) {
          const response = await axios.get(`${API_URL}/api/admin/wishes?limit=1000`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
          });
          allWishes = response.data.wishes || response.data;
          console.log("Successfully fetched all wishes for PDF:", allWishes.length);
        }
      } catch (fetchErr) {
        console.error("Error fetching all wishes:", fetchErr);
        // Continue with wishes we already have
      }
      
      console.log(`Generating PDF with ${allWishes.length} wishes`);
      
      try {
        // Create PDF document with orientation and unit specifications
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });        // Add title
        doc.setFont("times", "italic");
        doc.setFontSize(24);
        doc.setTextColor(183, 110, 121); // Return to original #B76E79 color
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Keep the decorative border but remove background
        doc.setDrawColor(100, 140, 110); // Keep sage green border
        doc.setLineWidth(0.5);
        doc.rect(5, 5, pageWidth-10, pageHeight-10, 'S');
        
        doc.text('Jamie & Leanne', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text('Wedding Guestbook', pageWidth / 2, 30, { align: 'center' });
        doc.setFontSize(12);
        doc.text('22nd August 2025', pageWidth / 2, 38, { align: 'center' });        // Style for header row
        const tableHeaderStyle = {
          fillColor: [183, 110, 121], // Return to original #B76E79 color
          textColor: [255, 255, 255], // White text
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 8,
          fontSize: 12,
          lineWidth: 0.5,
          lineColor: [100, 140, 110] // Keep sage green border
        };
        
        // Prepare data for table, ensuring all fields exist and handling null values
        const tableData = allWishes.map(wish => [
          wish && wish.name ? String(wish.name) : '',
          wish && wish.message ? String(wish.message) : '',
          wish && wish.createdAt ? formatDate(wish.createdAt) : ''
        ]);
        
        console.log("Table data prepared:", tableData.length);        // Create wish entries table
        doc.autoTable({
          startY: 55,
          head: [['Name', 'Message', 'Date']],
          body: tableData,
          headStyles: tableHeaderStyle,
          styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            fontSize: 9,
            cellPadding: 5,
            lineColor: [100, 140, 110], // Keep sage green border
            lineWidth: 0.5
          },
          columnStyles: {
            0: { 
              cellWidth: 40,
              fontStyle: 'bold',
              textColor: [0, 0, 0] // Return to black text
            },
            1: { 
              cellWidth: 'auto',
              fontSize: 10,
              fontStyle: 'normal',
              cellPadding: 6,
              textColor: [0, 0, 0] // Return to black text
            },
            2: { 
              cellWidth: 40,
              fontStyle: 'italic',
              fontSize: 8,
              textColor: [0, 0, 0] // Return to black text
            }
          },
          alternateRowStyles: {
            fillColor: [255, 255, 255] // Return to white background
          },
          margin: { top: 50, left: 15, right: 15 },
          didParseCell: function(data) {
            // Keep only the sage green border
            if (data.section === 'body') {
              data.cell.styles.lineColor = [100, 140, 110]; // Keep sage green border
              
              // Set text colors back to original
              if (data.column.index === 0) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [0, 0, 0]; // Black for names
              }
            }
          },
          didDrawPage: (data) => {
            // Add page number at the bottom
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100); // Gray for page numbers
            doc.text(
              `Page ${data.pageNumber} of ${data.pageCount}`,
              pageWidth / 2, 
              pageHeight - 10, 
              { align: 'center' }
            );
          }
        });        // Add footer with total count
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100); // Return to original gray
        doc.text(
          `Total messages: ${allWishes.length}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        
        console.log("PDF generated successfully, saving...");
        
        // Save PDF
        doc.save('jamie-and-leanne-guestbook.pdf');
        
        console.log("PDF saved successfully");
        
        // Show success message
        downloadingEl.textContent = 'Guestbook PDF downloaded successfully!';
        downloadingEl.className = 'admin-download-toast success';
        setTimeout(() => {
          if (document.body.contains(downloadingEl)) {
            document.body.removeChild(downloadingEl);
          }
        }, 3000);
      } catch (pdfErr) {
        console.error("Error during PDF generation:", pdfErr);
        throw pdfErr; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF guestbook');
      
      // Make error more visible
      const errorEl = document.createElement('div');
      errorEl.className = 'admin-download-toast';
      errorEl.style.background = 'var(--admin-danger)';
      errorEl.textContent = `PDF Generation Error: ${err.message || 'Unknown error'}`;
      document.body.appendChild(errorEl);
      
      setTimeout(() => {
        if (document.body.contains(errorEl)) {
          document.body.removeChild(errorEl);
        }
      }, 5000);
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
