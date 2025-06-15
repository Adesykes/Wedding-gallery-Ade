import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PageWrapper from './PageWrapper';

const API_URL = 'https://wedding-gallery-ade-backend.onrender.com';

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedWishes, setSelectedWishes] = useState([]); // Added for multiple wish selection
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
      
      // Clear from selectedWishes if it was selected
      setSelectedWishes(prev => prev.filter(id => id !== wishId));
      
      // Close modal if open
      if (selectedWish && selectedWish._id === wishId) {
        setSelectedWish(null);
      }
      
      alert('Message deleted successfully');
    } catch (err) {
      console.error('Error deleting wish:', err);
      alert('Error deleting message. Please try again.');
    }
  };

  // Function to handle multiple wish selection
  const handleWishSelection = (wishId) => {
    setSelectedWishes(prev => {
      if (prev.includes(wishId)) {
        return prev.filter(id => id !== wishId);
      } else {
        return [...prev, wishId];
      }
    });
  };

  // Function to handle bulk wish deletion
  const handleBulkDeleteWishes = async () => {
    if (selectedWishes.length === 0) {
      alert('Please select at least one message to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedWishes.length} selected messages?`)) return;

    try {
      // Delete each selected wish sequentially
      for (const wishId of selectedWishes) {
        await axios.delete(
          `${API_URL}/api/admin/wishes/${wishId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          }
        );
      }

      // Update wishes list
      setWishes(prev => prev.filter(wish => !selectedWishes.includes(wish._id)));
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        totalWishes: prevStats.totalWishes - selectedWishes.length
      }));
      
      // Clear selected wishes
      setSelectedWishes([]);
      
      alert(`${selectedWishes.length} messages deleted successfully`);
    } catch (err) {
      console.error('Error deleting wishes:', err);
      alert('Error deleting messages. Please try again.');
    }
  };

  // Function to toggle select all wishes
  const toggleSelectAllWishes = () => {
    if (selectedWishes.length === wishes.length) {
      // If all are selected, clear selection
      setSelectedWishes([]);
    } else {
      // Otherwise select all
      setSelectedWishes(wishes.map(wish => wish._id));
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
        });        // Add title with elegant styling
        // Define our theme colors
        const primaryColor = [183, 110, 121]; // Romantic pink/rose - #B76E79
        const accentColor = [156, 175, 136];  // Sage green - #9CAF88
        const goldColor = [212, 175, 55];     // Gold - #D4AF37
        const creamColor = [255, 253, 245];   // Cream - #FFFDF5
        const darkText = [74, 78, 105];       // Dark blue-gray - #4A4E69
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add a cream background to the entire page
        doc.setFillColor(...creamColor);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Add decorative gold corners
        const cornerSize = 15;
        const cornerThickness = 1;
        
        // Top-left corner
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(cornerThickness);
        doc.line(5, 5, 5 + cornerSize, 5); // Horizontal line
        doc.line(5, 5, 5, 5 + cornerSize); // Vertical line
        
        // Top-right corner
        doc.line(pageWidth - 5, 5, pageWidth - 5 - cornerSize, 5); // Horizontal line
        doc.line(pageWidth - 5, 5, pageWidth - 5, 5 + cornerSize); // Vertical line
        
        // Bottom-left corner
        doc.line(5, pageHeight - 5, 5 + cornerSize, pageHeight - 5); // Horizontal line
        doc.line(5, pageHeight - 5, 5, pageHeight - 5 - cornerSize); // Vertical line
        
        // Bottom-right corner
        doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5 - cornerSize, pageHeight - 5); // Horizontal line
        doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5, pageHeight - 5 - cornerSize); // Vertical line
        
        // Add decorative header background
        doc.setFillColor(255, 255, 255, 0.8); // Semi-transparent white
        doc.roundedRect(10, 8, pageWidth - 20, 40, 3, 3, 'F');
        
        // Add decorative border around the header
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.8);
        doc.roundedRect(10, 8, pageWidth - 20, 40, 3, 3, 'S');
        
        // Add second decorative border with gold
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(0.3);
        doc.roundedRect(12, 10, pageWidth - 24, 36, 2, 2, 'S');
        
        // Add title
        doc.setFont("times", "italic");
        doc.setFontSize(28);
        doc.setTextColor(...primaryColor);
        doc.text('Jamie & Leanne', pageWidth / 2, 25, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setTextColor(...accentColor);
        doc.text('Wedding Guestbook', pageWidth / 2, 35, { align: 'center' });
        
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...darkText);
        doc.text('22nd August 2025', pageWidth / 2, 43, { align: 'center' });        // Style for header row with our theme colors
        const tableHeaderStyle = {
          fillColor: primaryColor, // Romantic pink/rose
          textColor: [255, 255, 255], // White text
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 8,
          fontSize: 12,
          lineWidth: 0.5,
          lineColor: goldColor // Gold border
        };
        
        // Prepare data for table, ensuring all fields exist and handling null values
        const tableData = allWishes.map(wish => [
          wish && wish.name ? String(wish.name) : '',
          wish && wish.message ? String(wish.message) : '',
          wish && wish.createdAt ? formatDate(wish.createdAt) : ''
        ]);
        
        console.log("Table data prepared:", tableData.length);        // Create wish entries table with beautiful styling
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
            lineColor: accentColor, // Sage green border
            lineWidth: 0.5,
            font: "times"
          },
          columnStyles: {
            0: { 
              cellWidth: 40,
              fontStyle: 'bold',
              textColor: primaryColor, // Pink for names
              fontSize: 10
            },
            1: { 
              cellWidth: 'auto',
              fontSize: 10,
              fontStyle: 'normal',
              cellPadding: 6,
              textColor: darkText // Dark blue-gray for message text
            },
            2: { 
              cellWidth: 40,
              fontStyle: 'italic',
              fontSize: 8,
              textColor: [100, 100, 100] // Gray for dates
            }
          },
          alternateRowStyles: {
            fillColor: [248, 246, 240] // Very light cream for alternate rows
          },
          margin: { top: 50, left: 15, right: 15 },
          didParseCell: function(data) {
            // Enhanced cell styling
            if (data.section === 'body') {
              // Add elegant borders
              data.cell.styles.lineColor = accentColor; // Sage green border
              
              // Special styling for different columns
              if (data.column.index === 0) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = primaryColor; // Pink for names
              }
              
              // Add a subtle background color to every cell
              if (data.row.index % 2 === 0) {
                data.cell.styles.fillColor = [255, 255, 255]; // White
              } else {
                data.cell.styles.fillColor = [248, 246, 240]; // Very light cream
              }
              
              // Add special styling to first and last rows
              if (data.row.index === 0) {
                data.cell.styles.lineWidth = 0.75;
                data.cell.styles.lineColor = goldColor; // Gold for first row
              } else if (data.row.index === tableData.length - 1) {
                data.cell.styles.lineWidth = 0.75;
              }
            }
          },
          didDrawPage: (data) => {
            // Add decorative footer to each page
            // Golden line above page number
            doc.setDrawColor(...goldColor);
            doc.setLineWidth(0.5);
            doc.line(pageWidth/4, pageHeight - 15, pageWidth*3/4, pageHeight - 15);
            
            // Add page number with enhanced styling
            doc.setFont("times", "italic");
            doc.setFontSize(10);
            doc.setTextColor(...darkText);
            doc.text(
              `Page ${data.pageNumber} of ${data.pageCount}`,
              pageWidth / 2, 
              pageHeight - 10, 
              { align: 'center' }
            );
            
            // Re-draw corner decorations on each page
            // Top-left corner
            doc.setDrawColor(...goldColor);
            doc.setLineWidth(cornerThickness);
            doc.line(5, 5, 5 + cornerSize, 5);
            doc.line(5, 5, 5, 5 + cornerSize);
            
            // Top-right corner
            doc.line(pageWidth - 5, 5, pageWidth - 5 - cornerSize, 5);
            doc.line(pageWidth - 5, 5, pageWidth - 5, 5 + cornerSize);
            
            // Bottom-left corner
            doc.line(5, pageHeight - 5, 5 + cornerSize, pageHeight - 5);
            doc.line(5, pageHeight - 5, 5, pageHeight - 5 - cornerSize);
            
            // Bottom-right corner
            doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5 - cornerSize, pageHeight - 5);
            doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5, pageHeight - 5 - cornerSize);
          }
        });        // Add enhanced footer with total count
        // Add decorative elements to the footer
        const lastPage = doc.getNumberOfPages();
        doc.setPage(lastPage);
        
        // Add decorative footer area with subtle background
        doc.setFillColor(248, 246, 240); // Very light cream
        doc.roundedRect(pageWidth/4 - 20, pageHeight - 25, pageWidth/2 + 40, 20, 3, 3, 'F');
        
        // Add gold border around footer
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(0.5);
        doc.roundedRect(pageWidth/4 - 20, pageHeight - 25, pageWidth/2 + 40, 20, 3, 3, 'S');
        
        // Add total count with enhanced styling
        doc.setFont("times", "italic");
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor); // Rose color for total count
        doc.text(
          `Total Messages: ${allWishes.length}`,
          pageWidth / 2,
          pageHeight - 15,
          { align: 'center' }
        );
        
        // Add decorative flourish
        const flourishWidth = 15;
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(0.3);
        
        // Left flourish
        doc.line(pageWidth/2 - 70, pageHeight - 15, pageWidth/2 - 50, pageHeight - 15);
        doc.line(pageWidth/2 - 45, pageHeight - 15, pageWidth/2 - 25, pageHeight - 15);
        
        // Right flourish
        doc.line(pageWidth/2 + 25, pageHeight - 15, pageWidth/2 + 45, pageHeight - 15);
        doc.line(pageWidth/2 + 50, pageHeight - 15, pageWidth/2 + 70, pageHeight - 15);
        
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
    <PageWrapper>
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
            <div className="admin-selection-controls">
            <label className="select-all-checkbox">
              <input
                type="checkbox"
                checked={selectedWishes.length === wishes.length && wishes.length > 0}
                onChange={toggleSelectAllWishes}
              />
              {selectedWishes.length === wishes.length && wishes.length > 0 
                ? 'Deselect All' 
                : 'Select All'}
            </label>
            {selectedWishes.length > 0 && (
              <button 
                className="admin-button admin-button-danger"
                onClick={handleBulkDeleteWishes}
              >
                Delete Selected ({selectedWishes.length})
              </button>
            )}
          </div>
          
          <div className="wishes-grid">
            {wishes.length > 0 ? wishes.map((wish) => (
              <div 
                key={wish._id} 
                className={`wish-card admin-wish-card ${selectedWishes.includes(wish._id) ? 'selected' : ''}`}
                onClick={(e) => {
                  // Only handle wish view if not clicking checkbox or delete button
                  if (!e.target.closest('.wish-actions') && e.target.type !== 'checkbox') {
                    handleViewWish(wish, e);
                  }
                }}
              >
                <input
                  type="checkbox"
                  className="wish-card-checkbox"
                  checked={selectedWishes.includes(wish._id)}
                  onChange={() => handleWishSelection(wish._id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="wish-header">
                  <div className="wish-name">{wish.name}</div>
                  <div className="wish-date">
                    {formatDate(wish.createdAt)}
                  </div>
                </div>
                <div className="wish-message">{wish.message}</div>
                <div className="wish-actions">
                  <button
                    className="admin-button admin-button-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWish(wish._id);
                    }}
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
              >                Delete Wish
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageWrapper>
  );
}

export default AdminDashboard;
