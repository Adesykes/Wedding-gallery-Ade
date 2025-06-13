import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from './PageWrapper';
import './GuestBook.css';
import HeartBackground from './HeartBackground';

const API_BASE = 'https://wedding-gallery-ade-backend.onrender.com';
const MAX_MESSAGE_LENGTH = 500;
const WISHES_PER_PAGE = 10;

export default function GuestBook() {
  const navigate = useNavigate();
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Reference to observe for infinite scroll
  const observer = useRef();
  // Reference to the last wish element
  const lastWishElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreWishes();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  // Get guestId from localStorage (or generate if not present)
  const getGuestId = () => {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  };

  // Load initial wishes
  useEffect(() => {
    const fetchWishes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/wishes`);
        if (!response.ok) throw new Error('Failed to fetch wishes');
        
        const data = await response.json();
        
        // Handle both the new paginated response and the old array response format
        if (data.wishes && Array.isArray(data.wishes)) {
          // New format with pagination
          setWishes(data.wishes);
          setHasMore(data.pagination?.hasMore || false);
        } else if (Array.isArray(data)) {
          // Old format (direct array)
          setWishes(data);
          setHasMore(false); // No pagination in the old format
        } else {
          // Unexpected format
          console.error('Unexpected response format:', data);
          setWishes([]);
          setHasMore(false);
        }
        
        setPage(1);
      } catch (err) {
        console.error('Error fetching wishes:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWishes();
  }, []);
  
  // Function to load more wishes (called when user scrolls to bottom)
  const loadMoreWishes = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await fetch(`${API_BASE}/api/wishes?page=${nextPage}&limit=${WISHES_PER_PAGE}`);
      
      if (!response.ok) throw new Error('Failed to fetch more wishes');
      
      const data = await response.json();
      
      // Handle different response formats
      if (data.wishes && Array.isArray(data.wishes)) {
        // New paginated format
        setWishes(prev => [...prev, ...data.wishes]);
        setHasMore(data.pagination?.hasMore || false);
        setPage(nextPage);
      } else if (Array.isArray(data)) {
        // Old format (direct array) - just add all and disable hasMore
        setWishes(prev => [...prev, ...data]);
        setHasMore(false);
      } else {
        console.error('Unexpected response format when loading more wishes:', data);
      }
    } catch (err) {
      console.error('Error loading more wishes:', err);
    } finally {
      setLoadingMore(false);
    }
  };

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
            {loading && wishes.length === 0 ? (
              // Show loading placeholders for initial load
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="wish-shimmer"></div>
              ))
            ) : wishes.length > 0 ? (
              // Show actual wishes with infinite scroll
              wishes.map((wish, index) => {
                // If this is the last element, attach the ref for infinite scroll
                if (wishes.length === index + 1) {
                  return (
                    <div 
                      ref={lastWishElementRef}
                      key={wish._id} 
                      className="wish-card"
                    >
                      <div className="wish-header">
                        <div className="wish-name">{wish.name}</div>
                        <div className="wish-date">{formatDate(wish.createdAt)}</div>
                      </div>
                      <div className="wish-message">{wish.message}</div>
                    </div>
                  );
                } else {
                  return (
                    <div key={wish._id} className="wish-card">
                      <div className="wish-header">
                        <div className="wish-name">{wish.name}</div>
                        <div className="wish-date">{formatDate(wish.createdAt)}</div>
                      </div>
                      <div className="wish-message">{wish.message}</div>
                    </div>
                  );
                }
              })
            ) : (
              // Show message when no wishes are available
              <div className="empty-message">
                Be the first to leave a message for the happy couple!
              </div>
            )}
            
            {/* Loading indicator for infinite scroll */}
            {loadingMore && (
              <div className="loading-more">
                <div className="wish-shimmer"></div>
                <div className="wish-shimmer"></div>
              </div>
            )}
            
            {/* End of content message */}
            {!hasMore && wishes.length > 0 && (
              <div className="end-of-wishes">
                <p>You've reached the end of the messages ♥</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
