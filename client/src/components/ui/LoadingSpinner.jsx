/**
 * Loading Spinner Component
 * Reusable loading indicator with multiple sizes
 */

import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = '#4338ca', text = '' }) => {
  const sizes = {
    small: '16px',
    medium: '32px',
    large: '48px',
    xlarge: '64px',
  };

  const borderWidths = {
    small: '2px',
    medium: '3px',
    large: '4px',
    xlarge: '5px',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: sizes[size],
          height: sizes[size],
          border: `${borderWidths[size]} solid rgba(255, 255, 255, 0.1)`,
          borderTop: `${borderWidths[size]} solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p
          style={{
            color: '#9ca3af',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          {text}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
