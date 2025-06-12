import React, { useEffect, useState } from 'react';

const API_URL = 'https://wedding-gallery-ade-backend.onrender.com';

export default function AdminPanel() {
  const [photos, setPhotos] = useState([]);
  const [resetPasscode, setResetPasscode] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/photos`)
      .then(res => res.json())
      .then(setPhotos)
      .catch(console.error);
  }, []);

  const handleDelete = async (url) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      setPhotos(prev => prev.filter(p => p.url !== url));
    } else {
      alert('Delete failed');
    }
  };

  const handleResetUserCount = async () => {
    setResetMessage('');
    const res = await fetch(`${API_URL}/api/photos/reset-user-count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: resetPasscode })
    });
    const data = await res.json();
    if (res.ok) {
      setResetMessage(data.message || 'User count reset!');
      setResetPasscode(''); // Clear passcode input on success
    } else {
      setResetMessage(data.error || 'Reset failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Panel</h2>
      <button
        onClick={() => window.open('/api/admin/download-zip?token=' + localStorage.getItem('adminToken'), '_blank')}
      >
        Download All as ZIP
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginTop: 20 }}>
        {photos.map(photo => (
          <div key={photo._id} style={{ border: '1px solid #ccc', padding: 5 }}>
            <img src={photo.url} alt="uploaded" style={{ width: '100%' }} />
            <button onClick={() => handleDelete(photo.url)} style={{ marginTop: 5 }}>
              Delete
            </button>
          </div>
        ))}
      </div>

      <div style={{ margin: '20px 0' }}>
        <h3>Admin Actions</h3>
        <input
          type="password"
          placeholder="Admin passcode"
          value={resetPasscode}
          onChange={e => setResetPasscode(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={handleResetUserCount}>
          Reset User Count
        </button>
        {resetMessage && <div style={{ marginTop: 8, color: resetMessage.includes('fail') ? 'red' : 'green' }}>{resetMessage}</div>}
      </div>
    </div>
  );
}
