import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import { useAppDispatch, useAppSelector } from './hooks/useRedux';
import socketService from './services/socket/socketService';

// Import components
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './pages/AuthPages/Login';
import Register from './pages/AuthPages/Register';
import NotFound from './pages/NotFound';
import Lobby from './pages/GamePages/Lobby';

// Import real GameRoom component
import GameRoom from './pages/GamePages/GameRoom';
import Profile from './pages/ProfilePages/Profile';

// AppContent component to use hooks
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  // Add debug logging
  console.log('Auth State:', { isAuthenticated, user, token: localStorage.getItem('token') });

  useEffect(() => {
    // Check if we have a token in localStorage
    if (localStorage.getItem('token')) {
      console.log('Token found in localStorage, loading user...');
      // Load the current user
      dispatch(getCurrentUser());
    } else {
      console.log('No token found in localStorage');
    }
  }, [dispatch]);

  // Connect to socket when authenticated
  useEffect(() => {
    console.log('Authentication state changed:', isAuthenticated);
    if (isAuthenticated) {
      console.log('Authenticated, connecting to socket...');
      socketService.connect();
    } else {
      console.log('Not authenticated, disconnecting socket...');
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      console.log('Component unmounting, disconnecting socket...');
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Game Routes - Protected */}
        <Route
          path="/lobby"
          element={
            <PrivateRoute>
              <Lobby />
            </PrivateRoute>
          }
        />
        <Route
          path="/game/:roomId"
          element={
            <PrivateRoute>
              <GameRoom />
            </PrivateRoute>
          }
        />
        
        {/* Profile Routes - Protected */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        
        {/* Redirect root to lobby if authenticated, otherwise to login */}
        <Route path="/" element={<Navigate to="/lobby" replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
