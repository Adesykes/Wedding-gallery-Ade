import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeartBackground from './HeartBackground';

const colors = {
  text: '#4B0082',
};

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        textAlign: 'center',
        padding: '3rem 1rem 1rem',
        background: '#FDF6F9',
      }}
    >
      <HeartBackground />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'rgba(255,255,255,0.85)',
        }}
      >
        <h1
          style={{
            fontFamily: '"Lucida Handwriting", cursive',
            fontSize: '3rem',
            color: '#9CAF88',
            marginBottom: '0.2rem',
          }}
        >
          Jamie & Leanne
        </h1>
        <span
          style={{
            fontFamily: '"Lucida Handwriting", cursive',
            fontSize: '1.5rem',
            color: '#9CAF88',
            marginBottom: '0.1rem',
          }}
        >
          22nd August 2025
        </span>

        <p
          style={{
            fontSize: '1.2rem',
            color: colors.text,
            maxWidth: 600,
            margin: '0 auto 1.5rem',
          }}
        >
          Welcome to our wedding photo gallery — share your favorite memories with us!
        </p>

        <p
          style={{
            fontSize: '1rem',
            color: colors.text,
            maxWidth: 700,
            margin: '0 auto',
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
          }}
        >
          {`To our incredible friends and family,
A heartfelt welcome to Jamie and Leanne’s wedding day! ❤️ Honestly, we're still processing the fact they actually managed to pull this off (kidding, mostly!). It fills our hearts with immense joy to share this magical celebration of their love with you all. Thank you for being such an important part of this beautiful chapter – and for showing up, we genuinely appreciate it!

This is your exclusive portal to become our official, highly-skilled (we hope!) memory-makers! As the day unfolds and you capture those precious moments through your unique perspective (and smartphone lenses), please upload your photos here. Don't be shy! Every single picture you share will be a unique thread, weaving together the tapestry of Jamie and Leanne's complete wedding story – especially all the hilarious bits they'll swear they don't remember.

Let's flood this digital album with laughter, boundless love, and truly unforgettable snapshots! We're counting on you to capture everything.

With all our love & thanks,
Adrian & Kerry`}
        </p>

        <button
          onClick={() => navigate('/gallery')}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1.1rem',
            cursor: 'pointer',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#9CAF88',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          Upload Your Photos
        </button>

        {/* New Admin Login Button */}
        <button
          onClick={() => navigate('/admin/login')}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1.2rem',
            fontSize: '1rem',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '2px solid #9CAF88',
            backgroundColor: 'transparent',
            color: '#9CAF88',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#9CAF88';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9CAF88';
          }}
        >
          Admin Login
        </button>
      </div>
    </motion.section>
  );
}
