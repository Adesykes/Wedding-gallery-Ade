import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from './PageWrapper';
import './GuestBook.css';
import HeartBackground from './HeartBackground';

const API_BASE = 'https://wedding-gallery-ade-backend.onrender.com';
const MAX_MESSAGE_LENGTH = 500;

export default function GuestBook() {
  const navigate = useNavigate();
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get guestId from localStorage (or generate if not present)
  const getGuestId = () => {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  };

  // Load all wishes
  useEffect(() => {
    const fetchWishes = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/wishes`);
        if (!response.ok) throw new Error('Failed to fetch wishes');
        
        const data = await response.json();
        setWishes(data);
      } catch (err) {
        console.error('Error fetching wishes:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWishes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Message is too long (maximum ${MAX_MESSAGE_LENGTH} characters)`);
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/wishes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          guestId: getGuestId()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit message');
      }
      
      const newWish = await response.json();
      
      // Update the wishes list with the new entry
      setWishes(prevWishes => [newWish, ...prevWishes]);
      
      // Clear the form
      setName('');
      setMessage('');
      
      // Show success message
      setSuccess('Thank you for your message!');
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error submitting wish:', err);
      setError(err.message || 'Failed to submit message. Please try again later.');
    } finally {
      setSubmitting(false);
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

  return (
    <PageWrapper>
      <HeartBackground />
      <div className="guestbook-container">
        <header className="guestbook-header">
          <div className="navigation-buttons">
            <button className="back-button" onClick={() => navigate('/')}>
              &larr; Back to Welcome
            </button>
            <button className="gallery-button" onClick={() => navigate('/gallery')}>
              View & Upload Photos
            </button>
          </div>
          <h1 className="guestbook-title">Jamie & Leanne</h1>
          <span className="guestbook-date">22nd August 2025</span>
          <p className="guestbook-intro">
            Leave your wishes and thoughts for the happy couple on their special day. 
            Your messages will be cherished for years to come.
          </p>
        </header>

        <section className="wish-form">
          <h2 className="form-title">Sign the Guest Book</h2>
          
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Your Name</label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                disabled={submitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message" className="form-label">Your Message</label>
              <textarea
                id="message"
                className="form-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your wishes for the couple here..."
                maxLength={MAX_MESSAGE_LENGTH + 1}
                disabled={submitting}
              ></textarea>
              <div className="char-count">
                {message.length}/{MAX_MESSAGE_LENGTH} characters
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="form-submit"
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Your Wishes'}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="form-title">Messages & Wishes</h2>
          
          <div className="wishes-container">
            {loading ? (
              // Show loading placeholders
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="wish-shimmer"></div>
              ))
            ) : wishes.length > 0 ? (
              // Show actual wishes
              wishes.map((wish) => (
                <div key={wish._id} className="wish-card">
                  <div className="wish-header">
                    <div className="wish-name">{wish.name}</div>
                    <div className="wish-date">{formatDate(wish.createdAt)}</div>
                  </div>
                  <div className="wish-message">{wish.message}</div>
                </div>
              ))
            ) : (
              // Show message when no wishes are available
              <div className="empty-message">
                Be the first to leave a message for the happy couple!
              </div>
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
