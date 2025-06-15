import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import WelcomeScreen from './components/WelcomeScreen';
import GuestUploadGallery from './components/GuestUploadGallery';
import GuestBook from './components/GuestBook';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ScrollToTop from './components/ScrollToTop';

// Move this into a child component, so that useLocation is inside Router
function AnimatedRoutes() {
  const location = useLocation();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAdminLoggedIn(!!token);
  }, []);

  const handleLogin = () => setIsAdminLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminLoggedIn(false);
  };

  return (
    <AnimatePresence mode="wait">
      <ScrollToTop />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/gallery" element={<GuestUploadGallery />} />
        <Route path="/guestbook" element={<GuestBook />} />

        <Route
          path="/admin/login"
          element={
            isAdminLoggedIn ? (
              <Navigate to="/admin" replace />
            ) : (
              <AdminLogin onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/admin"
          element={
            isAdminLoggedIn ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
