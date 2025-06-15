import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from './PageWrapper';

const API_URL = 'https://wedding-gallery-ade-backend.onrender.com';

function AdminLogin({ onLogin, onLogout }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      onLogin(); // Notify parent we're logged in on mount
      navigate('/admin');
    }
  }, [navigate, onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        throw new Error('Invalid password');
      }

      const data = await res.json();
      localStorage.setItem('adminToken', data.token);
      onLogin(); // Tell parent we're logged in now
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const token = localStorage.getItem('adminToken');

  const handleLogoutClick = () => {
    localStorage.removeItem('adminToken');
    if (onLogout) onLogout(); // Tell parent we're logged out now
    setPassword('');
    setError(null);
  };
  return (
    <PageWrapper>
      <div
        style={{
          maxWidth: 320,
          margin: '40px auto',
          padding: 20,
          border: '1px solid #ddd',
          borderRadius: 8,
        fontFamily: 'sans-serif',
        textAlign: 'center',
      }}
    >
      <h2>Admin Login</h2>

      {token ? (
        <>
          <p>You are already logged in.</p>
          <button
            onClick={handleLogoutClick}
            disabled={loading}
            style={{ padding: '8px 12px', cursor: 'pointer', marginBottom: 12 }}
          >
            Logout
          </button>
          <br />
          <button
            onClick={() => navigate('/')}
            disabled={loading}
            style={{ padding: '8px 12px', cursor: 'pointer' }}
          >
            Back to Home
          </button>
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ marginBottom: 12, cursor: 'pointer' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
            <br />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 12px', width: '100%', cursor: 'pointer' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}

          <button
            onClick={() => navigate('/')}
            disabled={loading}
            style={{ padding: '8px 12px', marginTop: 16, cursor: 'pointer' }}          >
            Back to Home
          </button>
        </>
      )}
    </div>
    </PageWrapper>
  );
}

export default AdminLogin;
