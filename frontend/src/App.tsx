import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import { useAppDispatch, useAppSelector } from './hooks/useRedux';
import socketService from './services/socket/socketService';

// Import components
import PrivateRoute from './components/auth/PrivateRoute';

// Placeholder components until we create the real ones
const Login = () => <div>Login Page</div>;
const Register = () => <div>Register Page</div>;
const Lobby = () => <div>Lobby Page</div>;
const GameRoom = () => <div>Game Room Page</div>;
const Profile = () => <div>Profile Page</div>;
const NotFound = () => <div>404 - Page Not Found</div>;

// AppContent component to use hooks
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Check if we have a token in localStorage
    if (localStorage.getItem('token')) {
      // Load the current user
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
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
