// components/PageWrapper.js
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function PageWrapper({ children }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}     // Start hidden
      animate={{ opacity: 1 }}     // Fade in
      exit={{ opacity: 0 }}        // Fade out
      transition={{ duration: 0.5 }} // Half-second transition
    >
      {children}
    </motion.div>
  );
}
