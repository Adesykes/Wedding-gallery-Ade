import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import imageCompression from 'browser-image-compression';
import './GuestUploadGallery.css';
const API_BASE = 'https://wedding-gallery-ade-backend.onrender.com';
const MAX_UPLOADS = 30;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function GuestGalleryUpload() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

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
  }, []);  const handleFileChange = async (e) => {
    setError(null);
    const files = Array.from(e.target.files);

    // Clear input value to allow selecting the same file again
    e.target.value = '';

    if (uploadedCount + files.length > MAX_UPLOADS) {
      setError(`Upload limit reached. You can upload ${MAX_UPLOADS - uploadedCount} more photos.`);      
      return;
    }

    const compressedFiles = [];
    for (const file of files) {      try {
        // Validate file type
        if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
          throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, WebP, HEIC, or HEIF images.`);
        }let finalFile;        const compressionOptions = {
          maxWidthOrHeight: 2000, // ~4MP (2000x2000)
          maxSizeMB: 4,          // 4MB limit
          useWebWorker: true,
          initialQuality: 0.8,   // Good quality balance
          maxIteration: 10       // Reasonable compression iterations
        };

        // Show processing message for large files
        if (file.size > MAX_FILE_SIZE) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
          setError(`Processing ${file.name} (${sizeMB}MB)... This might take a moment.`);
          
          try {
            finalFile = await imageCompression(file, compressionOptions);            // If still too large after compression, try again with more aggressive settings
            if (finalFile.size > MAX_FILE_SIZE) {
              compressionOptions.maxSizeMB = 2;
              compressionOptions.initialQuality = 0.6;
              finalFile = await imageCompression(file, compressionOptions);
            }
          } catch (compressionErr) {
            console.error('Compression failed:', compressionErr);
            throw new Error(`Failed to compress ${file.name}. The file might be too large or corrupted.`);
          }
        } else {
          // Use original file if under size limit
          finalFile = file;
        }

        // Validate the final file
        if (finalFile.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} is too large (${(finalFile.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 4MB.`);
        }        const processedFile = {
          file: finalFile,
          preview: URL.createObjectURL(finalFile),
          name: file.name,
          type: file.type
        };
        compressedFiles.push(processedFile);
        setError(null);
      } catch (err) {
        console.error('File processing failed:', file.name, err);
        setError(err.message || `Failed to process ${file.name}. Please try a different image.`);
        // Clean up any created object URLs
        compressedFiles.forEach(f => URL.revokeObjectURL(f.preview));
        return;
      }
    }
      
    if (compressedFiles.length > 0) {
      setError(null);
      setSelectedFiles(prevFiles => {
        // Clean up old preview URLs
        prevFiles.forEach(f => URL.revokeObjectURL(f.preview));
        return compressedFiles;
      });
    }
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
        formData.append('photo', file.file); // append the actual File object
        formData.append('guestId', getGuestId());
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData,
        });        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        setPhotos(prev => [data, ...prev]);
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
  };  const removeFile = (index) => {
    if (selectedFiles[index] && selectedFiles[index].preview) {
      URL.revokeObjectURL(selectedFiles[index].preview);
    }
    
    // Create a completely new array without the file at the specified index
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    
    // Update state with the new array
    setSelectedFiles(newFiles);
  };  useEffect(() => {
    // Only run this effect when selectedFiles array length actually changes
    if (selectedFiles.length === 0) return;
    
    // Clean up any existing previews
    selectedFiles.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
    
    // Create new previews for all files
    const filesWithPreview = selectedFiles.map(file => ({
      ...file,
      preview: URL.createObjectURL(file.file)
    }));
    
    setSelectedFiles(filesWithPreview);
    
    // Cleanup function to revoke object URLs when component unmounts or effect reruns
    return () => {
      filesWithPreview.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
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
  // Handle opening the lightbox
  const openLightbox = (imageUrl, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLightboxImage(imageUrl);
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  };
  // Handle closing the lightbox
  const closeLightbox = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLightboxImage(null);
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  };
  // Handle clicking outside the lightbox to close it
  const handleLightboxClick = (e) => {
    if (e.target.classList.contains('lightbox-overlay') ||
        e.target.classList.contains('lightbox-close')) {
      closeLightbox(e);
    }
  };
  // Handle escape key to close lightbox
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [lightboxImage]);
  return (
    <PageWrapper>
      <div className="guest-upload-gallery">
        <section className="hero-section">
          <h1 className="hero-title">Jamie & Leanne</h1>
          <span className="hero-date">22nd August 2025</span>
          <p className="welcome-text">
            Welcome to our wedding photo gallery — share your favorite memories with us!
          </p>
          <div className="gallery-actions">
            <button className="gallery-action-button" onClick={() => navigate('/')}>
              &larr; Back to Welcome
            </button>
            <button className="gallery-action-button" onClick={() => navigate('/guestbook')}>
              Sign Guest Book
            </button>
          </div>        </section>        <div className="upload-container">
          <p style={{ marginBottom: '0.5rem' }}>
            You can upload up to {MAX_UPLOADS} photos per device.
          </p>
          <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
            Supported formats: JPEG, PNG, WebP, HEIC, HEIF (max 4MB per image)
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
              <span>📷 Take Photo</span>              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                disabled={uploading || uploadsLeft <= 0}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            <label className="upload-button secondary">
              <span>🖼️ Choose from Gallery</span>              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
              <p style={{ fontSize: '0.85rem', margin: '0.5rem 0', color: 'var(--text)' }}>
                Click on a photo to preview, or press × to remove it before uploading
              </p>
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
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                <label className="upload-button secondary" style={{ margin: 0 }}>
                  <span>🔄 Change Selection</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="upload-button primary"
                  style={{ margin: 0 }}
                >
                  {uploading ? 'Uploading...' : '📤 Upload Memories'}
                </button>
              </div>
            </div>
          )}
          {error && (
            <p style={{ color: 'var(--error)', marginTop: '1rem', textAlign: 'center', fontWeight: 600 }}
>
              {error}
            </p>
          )}
          <p style={{ color: '#888', fontSize: '0.875rem', textAlign: 'center', marginTop: '1rem' }}>    
            Photos will be resized to a maximum of 4 megapixels (2000x2000) and 4MB for faster uploads.
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
          </h3>          <div className="gallery-scroll">
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
                          onClick={(e) => openLightbox(photo.url, e)}
                        />
                      </div>
                    ))
                : <p style={{ color: '#aaa', margin: 'auto' }}>
                    No photos uploaded yet.
                  </p>
            }
          </div>
          {/* Preview Section - Now inside the container */}
          {previewImage && (
            <div className="preview-container">
              <img
                src={previewImage}
                alt="Upload preview"
                onClick={(e) => openLightbox(previewImage, e)}
              />
            </div>
          )}
        </div>
        {/* Lightbox */}
        <div
          className={`lightbox-overlay ${lightboxImage ? 'active' : ''}`}
          onClick={handleLightboxClick}
        >
          {lightboxImage && (
            <div className="lightbox-content">
              <img src={lightboxImage} alt="Enlarged view" className="lightbox-image" />
              <button className="lightbox-close" onClick={closeLightbox}>
                ×
              </button>
            </div>
          )}
        </div>
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
