import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from './PageWrapper';
import './GuestBook.css';
import HeartBackground from './HeartBackground';
import { checkForProfanity } from './utils/profanityCheck';

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
  
  // Selected wish for full view
  const [selectedWish, setSelectedWish] = useState(null);
  
  // Profanity detection state
  const [nameProfanity, setNameProfanity] = useState(false);
  const [messageProfanity, setMessageProfanity] = useState(false);
  
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
        // Handle both new and old response formats
        setWishes(data.wishes || data);
        setHasMore(data.pagination?.hasMore || false);
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

  // Clear error if both fields are free of profanity
  useEffect(() => {
    if (!nameProfanity && !messageProfanity && error.includes('inappropriate language')) {
      setError('');
    }
  }, [nameProfanity, messageProfanity, error]);
  // Animation states
  const [showInkAnimation, setShowInkAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Animation sequence
  const createInkWritingAnimation = () => {
    // Start the ink writing animation
    setShowInkAnimation(true);
    
    // After ink animation completes, show confetti and then hide both
    setTimeout(() => {
      setShowConfetti(true);
      
      // After confetti animation completes, hide everything
      setTimeout(() => {
        setShowConfetti(false);
        setShowInkAnimation(false);
      }, 3000);
    }, 2000); // Show confetti after the ink animation has had time to display
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    
    // Check for profanity
    const hasProfanity = checkForProfanity(value);
    setNameProfanity(hasProfanity);
    
    if (hasProfanity) {
      setError('Please remove inappropriate language from your name.');
    } else if (error.includes('inappropriate language')) {
      // Clear error only if it was a profanity error
      setError('');
    }
  };
  
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Check for profanity
    const hasProfanity = checkForProfanity(value);
    setMessageProfanity(hasProfanity);
    
    if (hasProfanity) {
      setError('Please remove inappropriate language from your message.');
    } else if (error.includes('inappropriate language')) {
      // Clear error only if it was a profanity error
      setError('');
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
    
    // Check for profanity one more time before submission
    if (checkForProfanity(name) || checkForProfanity(message)) {
      setError('Please remove inappropriate language before submitting.');
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
      
      // Trigger animation sequence
      createInkWritingAnimation();
      
      // Remove success message after animations complete
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
  
  // Function to view a wish in full detail
  const handleViewWish = (wish) => {
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
  return (
    <PageWrapper>
      <HeartBackground />      {showInkAnimation && (
        <div className="ink-animation-container">
          <div className="ink-animation">
            <div className="ink-text-container">
              <div className="ink-text">Thank you for your wishes</div>
            </div>
            <div className="ink-signature">Jamie & Leanne</div>
          </div>
        </div>
      )}
      
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 80 }).map((_, i) => (
            <div 
              key={i} 
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                animationDelay: `${Math.random() * 1.5}s`,
                backgroundColor: ['#FFB6C1', '#C8B6FF', '#B76E79', '#FFD700', '#9CAF88', '#FFCF95'][Math.floor(Math.random() * 6)]
              }}
            ></div>
          ))}
        </div>
      )}
      
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
        </header>        <section className="wish-form">
          <h2 className="form-title">Sign the Guest Book</h2>
          
          <p className="guestbook-intro">
            Leave a heartfelt message for Jamie & Leanne. Please keep your message appropriate for all ages.
          </p>
          
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Your Name</label>              <input
                type="text"
                id="name"
                className={`form-input ${nameProfanity ? 'profanity-error' : ''}`}
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your name"
                maxLength={50}
                disabled={submitting}
              />
              {nameProfanity && (
                <div className="error-message">Please remove inappropriate language from your name.</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="message" className="form-label">Your Message</label>              <textarea
                id="message"
                className={`form-textarea ${messageProfanity ? 'profanity-error' : ''}`}
                value={message}
                onChange={handleMessageChange}
                placeholder="Write your wishes for the couple here..."
                maxLength={MAX_MESSAGE_LENGTH + 1}
                disabled={submitting}
              ></textarea>
              <div className="char-count">
                {message.length}/{MAX_MESSAGE_LENGTH} characters
              </div>
              {messageProfanity && (
                <div className="error-message">Please remove inappropriate language from your message.</div>
              )}
              {error && !messageProfanity && <div className="error-message">{error}</div>}
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
                // Prepare the truncated message if needed
                const isLongMessage = wish.message?.length > 150;
                const displayMessage = isLongMessage 
                  ? `${wish.message.substring(0, 150)}...` 
                  : wish.message;
                
                // If this is the last element, attach the ref for infinite scroll
                if (wishes.length === index + 1) {
                  return (
                    <div 
                      ref={lastWishElementRef}
                      key={wish._id} 
                      className="wish-card"
                      onClick={() => handleViewWish(wish)}
                    >
                      <div className="wish-header">
                        <div className="wish-name">{wish.name}</div>
                        <div className="wish-date">{formatDate(wish.createdAt)}</div>
                      </div>
                      <div className="wish-message">
                        {displayMessage}
                        {isLongMessage && (
                          <button className="read-more-btn">Read More</button>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div 
                      key={wish._id} 
                      className="wish-card"
                      onClick={() => handleViewWish(wish)}
                    >
                      <div className="wish-header">
                        <div className="wish-name">{wish.name}</div>
                        <div className="wish-date">{formatDate(wish.createdAt)}</div>
                      </div>
                      <div className="wish-message">
                        {displayMessage}
                        {isLongMessage && (
                          <button className="read-more-btn">Read More</button>
                        )}
                      </div>
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
        
        {/* Wish Detail Modal */}
        {selectedWish && (
          <div className="wish-modal-overlay" onClick={handleCloseWishView}>
            <div className="wish-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={handleCloseWishView}>&times;</button>
              <div className="wish-modal-header">
                <h3 className="wish-modal-name">{selectedWish.name}</h3>
                <div className="wish-modal-date">{formatDate(selectedWish.createdAt)}</div>
              </div>
              <div className="wish-modal-message">
                {selectedWish.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
