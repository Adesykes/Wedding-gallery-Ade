import React, { useState, useEffect } from 'react';
import { getOrCreateGuestToken } from '../utils/jwt';
import axios from 'axios';

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const token = getOrCreateGuestToken();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 30) {
      setMessage('You can only upload up to 30 photos.');
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('photos', file));
    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Upload successful!');
    } catch (err) {
      setMessage('Upload failed.');
    }
  };

  return (
    <div className="page">
      <h1>Welcome to the Wedding Gallery</h1>
      <p>Upload up to 30 photos from your device or camera.</p>

      <input
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileChange}
      />
      <button onClick={handleUpload}>Upload</button>
<a href="/gallery" style={{ display: 'block', marginTop: '1rem', color: '#b14c4c' }}>
  View Gallery
</a>

      <p>{message}</p>
    </div>
  );
}
