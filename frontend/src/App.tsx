import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';

// Import components
import PrivateRoute from './components/auth/PrivateRoute';

// Placeholder components until we create the real ones
const Login = () => <div>Login Page</div>;
const Register = () => <div>Register Page</div>;
const Lobby = () => <div>Lobby Page</div>;
const GameRoom = () => <div>Game Room Page</div>;
const Profile = () => <div>Profile Page</div>;
const NotFound = () => <div>404 - Page Not Found</div>;

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
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
      </Router>
    </Provider>
  );
};

export default App;
