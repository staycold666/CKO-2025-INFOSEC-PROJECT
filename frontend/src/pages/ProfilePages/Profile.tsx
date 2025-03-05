import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import apiService from '../../services/api/apiService';
import { User, UserStats } from '../../types';

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { user } = useAppSelector(
    (state) => state.auth as { user: User | null }
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setUsername(user.username);
      setAvatar(user.avatar || '');
      
      // Fetch user stats
      fetchUserStats();
    }
  }, [user, navigate]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserStats(user.id);
      
      if (response.success && response.data) {
        setStats(response.data.stats || null);
      } else {
        setError(response.error || 'Failed to fetch user stats');
      }
    } catch (err) {
      setError('An error occurred while fetching user stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.updateProfile(user.id, {
        username,
        avatar,
      });
      
      if (response.success) {
        setIsEditing(false);
        // Update local state with new data
        // In a real app, you would dispatch an action to update the user in the Redux store
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
    },
    button: {
      backgroundColor: '#3182ce',
      color: 'white',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginLeft: '0.5rem',
    },
    logoutButton: {
      backgroundColor: '#e53e3e',
      color: 'white',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    profileSection: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem',
    },
    profileHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    avatar: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      backgroundColor: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '1.5rem',
      fontSize: '2rem',
      color: '#4a5568',
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
    },
    formActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.5rem',
      marginTop: '1rem',
    },
    cancelButton: {
      backgroundColor: '#e2e8f0',
      color: '#4a5568',
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    statsSection: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '1rem',
      marginTop: '1rem',
    },
    statCard: {
      padding: '1rem',
      backgroundColor: '#f7fafc',
      borderRadius: '4px',
      textAlign: 'center' as const,
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#3182ce',
    },
    statLabel: {
      color: '#4a5568',
      fontSize: '0.875rem',
    },
    error: {
      color: '#e53e3e',
      marginTop: '1rem',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '1rem',
    },
  };

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Profile</h1>
        <div>
          <button 
            style={styles.button}
            onClick={() => navigate('/lobby')}
          >
            Game Lobby
          </button>
          <button 
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={styles.profileSection}>
        {isEditing ? (
          <form onSubmit={handleUpdateProfile}>
            <div style={styles.formGroup}>
              <label htmlFor="username" style={styles.label}>Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="avatar" style={styles.label}>Avatar URL</label>
              <input
                id="avatar"
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                style={styles.input}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => {
                  setIsEditing(false);
                  setUsername(user.username);
                  setAvatar(user.avatar || '');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.button}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
            {error && <div style={styles.error}>{error}</div>}
          </form>
        ) : (
          <>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt={username} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  username.charAt(0).toUpperCase()
                )}
              </div>
              <div style={styles.userInfo}>
                <h2 style={styles.username}>{username}</h2>
                <button
                  style={styles.button}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={styles.statsSection}>
        <h2>Game Statistics</h2>
        
        {isLoading && !stats ? (
          <div style={styles.loading}>Loading stats...</div>
        ) : stats ? (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.wins}</div>
              <div style={styles.statLabel}>Wins</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.losses}</div>
              <div style={styles.statLabel}>Losses</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.totalGames}</div>
              <div style={styles.statLabel}>Total Games</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.totalScore}</div>
              <div style={styles.statLabel}>Total Score</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.accuracy}%</div>
              <div style={styles.statLabel}>Accuracy</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {stats.totalGames > 0 ? (stats.wins / stats.totalGames * 100).toFixed(1) : 0}%
              </div>
              <div style={styles.statLabel}>Win Rate</div>
            </div>
          </div>
        ) : (
          <p>No stats available yet. Play some games to see your statistics!</p>
        )}
      </div>
    </div>
  );
};

export default Profile;