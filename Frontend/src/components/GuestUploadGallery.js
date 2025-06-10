import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import imageCompression from 'browser-image-compression';

const MAX_UPLOADS = 30;

export default function GuestGalleryUpload() {
  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // Load photos initially
  useEffect(() => {
   fetch(`${API_BASE}/api/photos`)
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
    if (uploadedCount + files.length > MAX_UPLOADS) {
      setError(`Upload limit exceeded. You can upload ${MAX_UPLOADS - uploadedCount} more photos.`);
      return;
    }

    const compressedFiles = [];
    for (const file of files) {
      try {
        const options = {
          maxWidthOrHeight: 4000, // ~12MP (4000x3000)
          maxSizeMB: 4,           // Optional: limit file size (e.g., 4MB)
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        compressedFile.preview = URL.createObjectURL(compressedFile);
        compressedFile.name = file.name; // preserve original name if needed
        compressedFiles.push(compressedFile);
      } catch (err) {
        setError('Image compression failed');
        return;
      }
    }
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
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('photo', file); // file is the File object from input

        const res = await fetch('/api/upload', {
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

  return (
    <PageWrapper>
      <style>
        {`@keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }`}
      </style>

      <div style={{
        fontFamily: "'Poppins', sans-serif",
        background: 'linear-gradient(135deg, #FFF1F5, #FDF6F9)',
        paddingBottom: '4rem',
      }}>
        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          padding: '3rem 1rem 1rem',
          background: '#FDF6F9',
        }}>
          <h1 style={{
            fontFamily: '"Lucida Handwriting", cursive',
            fontSize: '3rem',
            color: '#9CAF88',
            marginBottom: '0.2rem',
          }}>
            Jamie & Leanne
          </h1>
          <span style={{
            fontFamily: '"Lucida Handwriting", cursive',
            fontSize: '1.5rem',
            color: '#9CAF88',
          }}>
            22nd August 2025
          </span>
          <p style={{
            fontSize: '1.2rem',
            color: colors.text,
            maxWidth: 600,
            margin: '0 auto',
          }}>
            Welcome to our wedding photo gallery — share your favorite memories with us!
          </p>
        </section>

        <div style={{
          maxWidth: 900,
          margin: '2rem auto',
          padding: 40,
          backgroundColor: colors.background,
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        }}>
          <p style={{ textAlign: 'center', marginBottom: 10 }}>
            You can upload up to {MAX_UPLOADS} photos per device.
          </p>
          <p style={{ textAlign: 'center', marginBottom: 25, fontWeight: 'bold', color: uploadsLeft === 0 ? colors.error : colors.accent }}>
            Uploads left: {uploadsLeft > 0 ? uploadsLeft : 0}
          </p>

          {/* Two upload options: Take Photo or Choose from Gallery */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 25, justifyContent: 'center' }}>
            {/* Take Photo */}
            <label style={{
              flex: 1,
              background: colors.primary,
              color: 'white',
              padding: '12px 0',
              borderRadius: 8,
              textAlign: 'center',
              fontWeight: 'bold',
              cursor: uploading || uploadsLeft <= 0 ? 'not-allowed' : 'pointer',
              opacity: uploading || uploadsLeft <= 0 ? 0.6 : 1,
              border: 'none',
              fontSize: 16,
            }}>
              📷 Take Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={uploading || uploadsLeft <= 0}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {/* Choose from Gallery */}
            <label style={{
              flex: 1,
              background: '#fff',
              color: colors.primary,
              padding: '12px 0',
              borderRadius: 8,
              textAlign: 'center',
              fontWeight: 'bold',
              cursor: uploading || uploadsLeft <= 0 ? 'not-allowed' : 'pointer',
              opacity: uploading || uploadsLeft <= 0 ? 0.6 : 1,
              border: `2px solid ${colors.primary}`,
              fontSize: 16,
            }}>
              🖼️ Choose from Gallery
              <input
                type="file"
                accept="image/*"
                disabled={uploading || uploadsLeft <= 0}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div style={{
              marginBottom: 25,
              padding: 20,
              backgroundColor: '#fff',
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
            }}>
              <strong style={{ color: colors.accent }}>Files ready to upload:</strong>
              <div style={{
                display: 'flex',
                gap: 12,
                marginTop: 12,
                overflowX: 'auto',
                paddingBottom: 10,
              }}>
                {selectedFiles.map((file, i) => (
                  <div key={i} style={{
                    position: 'relative',
                    minWidth: 90,
                    maxWidth: 90,
                    flex: '0 0 auto',
                    textAlign: 'center',
                  }}>
                    <img
                      src={file.preview || URL.createObjectURL(file)}
                      alt={file.name}
                      onClick={() => setPreviewImage(file.preview || URL.createObjectURL(file))}
                      style={{
                        width: '100%',
                        height: 90,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #F3D1DC',
                        cursor: 'pointer',
                      }}
                    />
                    <button onClick={() => removeFile(i)} style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: '#B91C1C',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}>
                      ×
                    </button>
                    <small style={{
                      fontSize: 10,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}>
                      {file.name}
                    </small>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  marginTop: 20,
                  padding: '12px 0',
                  width: '100%',
                  backgroundColor: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Uploading...' : '📷 Upload Memories'}
              </button>
            </div>
          )}

          {error && (
            <p style={{ color: colors.error, marginBottom: 20, textAlign: 'center', fontWeight: 600 }}>
              {error}
            </p>
          )}

          <p style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>
            Photos will be resized to a maximum of 12 megapixels for faster uploads.
          </p>

          <hr style={{ border: 'none', borderTop: '1px dashed #F3D1DC', margin: '40px 0' }} />

          <h3 style={{ marginBottom: 20, color: colors.accent, textAlign: 'center' }}>
            Uploaded Photos
          </h3>

          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: 16,
              padding: 8,
              scrollbarWidth: 'thin',
              scrollbarColor: '#9CAF88 #FDF6F9',
              background: '#fff',
              borderRadius: 20,
              marginBottom: 24,
            }}
          >
            {loadingPhotos
              ? Array.from({ length: 6 }).map((_, idx) => <PlaceholderCard key={idx} />)
              : photos.length > 0
                ? photos
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((photo) => (
                    <img
                      key={photo._id}
                      src={photo.url}
                      alt="Wedding upload"
                      style={{
                        width: 150,
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: 16,
                        cursor: 'pointer',
                        border: `2px solid ${colors.border}`,
                        flex: '0 0 auto',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                      onClick={() => setPreviewImage(photo.url)}
                      loading="lazy"
                    />
                  ))
                : <p style={{ color: '#aaa', margin: 'auto' }}>
                    No photos uploaded yet.
                  </p>
            }
          </div>

          {/* Lightbox */}
          {previewImage && (
            <div
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'zoom-out',
                zIndex: 1000,
              }}
            >
              <img
                src={previewImage}
                alt="Preview"
                style={{ maxHeight: '90%', maxWidth: '90%', borderRadius: 20 }}
                onClick={e => e.stopPropagation()}
              />
              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: 36,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
