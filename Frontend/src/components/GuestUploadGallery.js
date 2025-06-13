import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import imageCompression from 'browser-image-compression';
import './GuestUploadGallery.css';
const API_BASE = 'https://wedding-gallery-ade-backend.onrender.com';

const MAX_UPLOADS = 30;

export default function GuestGalleryUpload() {
  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // Load photos initially (only for this guest)
  useEffect(() => {
    const guestId = getGuestId();
    fetch(`${API_BASE}/api/photos?guestId=${guestId}`)
      .then(res => res.json())
      .then(data => setPhotos(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingPhotos(false));
  }, []);

  // Get current uploaded count from localStorage
  const getUploadedCount = () => {
    const count = localStorage.getItem('uploadCount');
    return count ? parseInt(count, 10) : 0;
  };

  // Get guestId from localStorage (or generate if not present)
  const getGuestId = () => {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  };

  // Set uploaded count in localStorage
  const setUploadedCount = (count) => {
    localStorage.setItem('uploadCount', count.toString());
  };

  // Upload count state synced with localStorage
  const [uploadedCount, setUploadedCountState] = useState(getUploadedCount());

  // Sync localStorage count with React state on mount
  useEffect(() => {
    setUploadedCountState(getUploadedCount());
  }, []);

  const handleFileChange = async (e) => {
    setError(null);
    const files = Array.from(e.target.files);
    
    // Clear input value to allow selecting the same file again
    e.target.value = '';
    
    if (uploadedCount + files.length > MAX_UPLOADS) {
      setError(`Upload limit reached. You can upload ${MAX_UPLOADS - uploadedCount} more photos.`);
      return;
    }

    // Show loading state for large files
    if (files.some(file => file.size > 5000000)) { // 5MB
      setError('Processing large images, please wait...');
    }

    const compressedFiles = [];
    for (const file of files) {
      try {        const options = {
          maxWidthOrHeight: 4000, // ~12MP (4000x3000)
          maxSizeMB: 4,          // Optional: limit file size (e.g., 4MB)
          useWebWorker: true,
        };
        
        const compressedFile = await imageCompression(file, options);
        compressedFile.preview = URL.createObjectURL(compressedFile);
        compressedFile.name = file.name;
        compressedFiles.push(compressedFile);
      } catch (err) {
        console.error('Compression failed:', err);
        setError('Image processing failed. Please try again with a smaller image.');
        return;
      }
    }
    
    setError(null);
    setSelectedFiles(compressedFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('No files selected.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // When uploading, include guestId in the form data
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('photo', file); // file is the File object from input
        formData.append('guestId', getGuestId());
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        setPhotos(prev => [...prev, data]);
      }

      // Update counts
      const newCount = uploadedCount + selectedFiles.length;
      setUploadedCount(newCount);
      setUploadedCountState(newCount);
      setSelectedFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    if (selectedFiles[index]?.preview) {
      URL.revokeObjectURL(selectedFiles[index].preview);
    }
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  useEffect(() => {
    selectedFiles.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });

    const filesWithPreview = selectedFiles.map(file =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setSelectedFiles(filesWithPreview);

    return () => {
      filesWithPreview.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [selectedFiles.length]);

  const colors = {
    primary: '#D946EF',
    accent: '#F472B6',
    lavender: '#C084FC',
    background: '#FFF1F5',
    text: '#4B0082',
    error: '#B91C1C',
    border: '#FBCFE8',
    success: '#10B981', // Adding success color for reset feedback
    warning: '#F59E0B',
  };

  const PlaceholderCard = () => (
    <div style={{
      height: 150,
      borderRadius: 16,
      background: `linear-gradient(90deg, #f9e6f0 25%, #f3dce7 50%, #f9e6f0 75%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );

  const uploadsLeft = MAX_UPLOADS - uploadedCount;

  // --- Admin Reset User Count ---
  const [resetPasscode, setResetPasscode] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleResetUserCount = async () => {
    setResetMessage('');
    if (!resetPasscode) {
      setResetMessage('Please enter the admin passcode.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/photos/reset-user-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: resetPasscode })
      });
      const data = await res.json();
      if (res.ok) {
        setUploadedCount(0);
        setUploadedCountState(0);
        setResetMessage('Your upload count has been reset!');
        setResetPasscode(''); // Clear passcode input on success
      } else {
        setResetMessage(data.error || 'Reset failed');
      }
    } catch (err) {
      setResetMessage('Reset failed.');
    }
  };

  useEffect(() => {
    const container = document.querySelector('.upload-container');
    
    const handleMouseMove = (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / container.clientWidth) * 100;
      const y = ((e.clientY - rect.top) / container.clientHeight) * 100;
      container.style.setProperty('--mouse-x', `${x}%`);
      container.style.setProperty('--mouse-y', `${y}%`);
    };

    container?.addEventListener('mousemove', handleMouseMove);
    return () => container?.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Add pinch-zoom support for lightbox
  const [scale, setScale] = useState(1);
  const [lastTouchDistance, setLastTouchDistance] = useState(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance - lastTouchDistance;
      setScale(prev => Math.min(Math.max(prev + delta * 0.01, 1), 3));
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(null);
  };

  return (
    <PageWrapper>
      <div className="guest-upload-gallery">
        <section className="hero-section">
          <h1 className="hero-title">Jamie & Leanne</h1>
          <span className="hero-date">22nd August 2025</span>
          <p className="welcome-text">
            Welcome to our wedding photo gallery — share your favorite memories with us!
          </p>
        </section>        <div className="upload-container">
          <p style={{ marginBottom: '0.5rem' }}>
            You can upload up to {MAX_UPLOADS} photos per device.
          </p>
          <p style={{ 
            fontWeight: 'bold',
            color: uploadsLeft === 0 ? 'var(--error)' : 'var(--accent)',
            marginBottom: '1.5rem'
          }}>
            Uploads left: {uploadsLeft > 0 ? uploadsLeft : 0}
          </p>

          <div className="upload-options">
            <label className="upload-button primary">
              <span>📷 Take Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={uploading || uploadsLeft <= 0}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>

            <label className="upload-button secondary">
              <span>🖼️ Choose from Gallery</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading || uploadsLeft <= 0}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="preview-section">
              <strong style={{ color: 'var(--accent)' }}>Files ready to upload:</strong>
              <div className="preview-grid">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="preview-item">
                    <img
                      src={file.preview}
                      alt={file.name}
                      onClick={() => setPreviewImage(file.preview)}
                    />
                    <button
                      onClick={() => removeFile(i)}
                      className="remove-button"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="upload-button primary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {uploading ? 'Uploading...' : '📤 Upload Memories'}
              </button>
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--error)', marginTop: '1rem', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </p>
          )}

          <p style={{ color: '#888', fontSize: '0.875rem', textAlign: 'center', marginTop: '1rem' }}>
            Photos will be resized to a maximum of 12 megapixels for faster uploads.
          </p>

          <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '2rem 0' }} />
          
          <div className="admin-reset">
            <h4>Admin Reset</h4>
            <div className="admin-reset-inputs">
              <input
                type="password"
                placeholder="Enter admin passcode"
                value={resetPasscode}
                onChange={e => setResetPasscode(e.target.value)}
                className="admin-input"
                aria-label="Admin passcode for reset"
              />
              <button
                onClick={handleResetUserCount}
                disabled={!resetPasscode}
                className="admin-button"
              >
                Reset Count
              </button>
            </div>
            {resetMessage && (
              <p className={`admin-message ${resetMessage.includes('failed') ? 'error' : 'success'}`}>
                {resetMessage}
              </p>
            )}
          </div>

          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)', textAlign: 'center' }}>
            Your Uploaded Photos
          </h3>

          <div className="gallery-scroll">
            {loadingPhotos
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="gallery-item loading-shimmer" />
                ))
              : photos.length > 0
                ? photos
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((photo) => (
                      <div key={photo._id} className="gallery-item">
                        <img
                          src={photo.url}
                          alt="Wedding upload"
                          onClick={() => setPreviewImage(photo.url)}
                        />
                      </div>
                    ))
                : <p style={{ color: '#aaa', margin: 'auto' }}>
                    No photos uploaded yet.
                  </p>
            }
          </div>
        </div>

        {previewImage && (
          <div 
            className="lightbox" 
            onClick={() => {
              setPreviewImage(null);
              setScale(1);
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={previewImage}
              alt="Preview"
              onClick={e => e.stopPropagation()}
              style={{
                transform: `scale(${scale})`,
                transition: lastTouchDistance ? 'none' : 'transform 0.3s ease',
                touchAction: 'none'
              }}
            />
            <button
              className="close-button"
              onClick={() => {
                setPreviewImage(null);
                setScale(1);
              }}
              aria-label="Close preview"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div 
            style={{ 
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '25px',
              zIndex: 1000,
              maxWidth: '90%',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            {error}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
