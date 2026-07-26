import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import api from './api/client';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Report from './pages/Report';
import Guidance from './pages/Guidance';
import NearbyCentres from './pages/NearbyCentres';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import OcrReadyToast from './components/OcrReadyToast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(state => state.token);
  if (!token) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

function App() {
  const { token, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setAuth(res.data.user, token))
        .catch(() => logout());
    }
  }, []);

  return (
    <Router>
      <div id="app">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <Navbar />
        <OcrReadyToast />
        <main id="main-content" tabIndex={-1}>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/guidance/:id" element={<ProtectedRoute><Guidance /></ProtectedRoute>} />
          <Route path="/centres" element={<ProtectedRoute><NearbyCentres /></ProtectedRoute>} />
          <Route path="/centres/:analysisId" element={<ProtectedRoute><NearbyCentres /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
