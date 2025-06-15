import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HeartBackground from './HeartBackground';
import PageWrapper from './PageWrapper';
import './WelcomeScreen.css';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const createSparkle = useCallback((e) => {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    document.body.appendChild(sparkle);

    const size = Math.random() * 20 + 10;
    const duration = Math.random() * 1000 + 500;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - size / 2;
    const y = e.clientY - size / 2;

    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.animation = `sparkle ${duration}ms ease-out forwards`;

    setTimeout(() => sparkle.remove(), duration);
  }, []);

  useEffect(() => {
    const content = document.querySelector('.welcome-content');
    const handleMouseMove = (e) => {
      if (Math.random() > 0.85) { // Only create sparkles sometimes
        createSparkle(e);
      }
    };

    content?.addEventListener('mousemove', handleMouseMove);
    return () => content?.removeEventListener('mousemove', handleMouseMove);
  }, [createSparkle]);
  return (
    <PageWrapper>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="welcome-screen"
      >
      <HeartBackground />
      <AnimatePresence>
        <motion.div 
          className="welcome-content"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="welcome-title"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Jamie & Leanne
          </motion.h1>

          <motion.span 
            className="welcome-date"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            22nd August 2025
          </motion.span>

          <div className="divider" />

          <motion.p 
            className="welcome-intro"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Welcome to our wedding photo gallery — share your favorite memories with us!
          </motion.p>

          <motion.p 
            className="welcome-message"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {`To our incredible friends and family,
A heartfelt welcome to Jamie and Leanne’s wedding day! ❤️ Honestly, we're still processing the fact they actually managed to pull this off (kidding, mostly!). It fills our hearts with immense joy to share this magical celebration of their love with you all. Thank you for being such an important part of this beautiful chapter – and for showing up, we genuinely appreciate it!

This is your exclusive portal to become our official, highly-skilled (we hope!) memory-makers! As the day unfolds and you capture those precious moments through your unique perspective (and smartphone lenses), please upload your photos here. Don't be shy! Every single picture you share will be a unique thread, weaving together the tapestry of Jamie and Leanne's complete wedding story – especially all the hilarious bits they'll swear they don't remember.

Let's flood this digital album with laughter, boundless love, and truly unforgettable snapshots! We're counting on you to capture everything.

With all our love & thanks,
Adrian & Kerry`}
          </motion.p>          <motion.button
            className="welcome-button"
            onClick={() => navigate('/gallery')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            Upload Your Photos
          </motion.button>

          <motion.button
            className="welcome-button secondary"
            onClick={() => navigate('/guestbook')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            Sign Guest Book
          </motion.button>

          <motion.button
            className="admin-button"
            onClick={() => navigate('/admin/login')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}          >
            Admin Login
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </motion.section>
    </PageWrapper>
  );
};

export default WelcomeScreen;
