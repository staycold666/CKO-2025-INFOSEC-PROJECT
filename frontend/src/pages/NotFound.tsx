import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '4rem 2rem',
      textAlign: 'center' as const,
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
    },
    message: {
      fontSize: '1.25rem',
      marginBottom: '2rem',
      color: '#4a5568',
    },
    link: {
      display: 'inline-block',
      backgroundColor: '#3182ce',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      textDecoration: 'none',
      fontWeight: 'bold',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404 - Page Not Found</h1>
      <p style={styles.message}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" style={styles.link}>
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;