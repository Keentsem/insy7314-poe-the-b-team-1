/**
 * Confirmation Dialog Component
 * Reusable modal for confirming actions
 */

import React, { useEffect, useCallback } from 'react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#10b981',
  cancelColor = '#6b7280',
  isDestructive = false,
  loading = false
}) => {
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !loading) {
      onConfirm();
    }
  }, [onClose, onConfirm, loading]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <h2
          id="dialog-title"
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: isDestructive ? '#ef4444' : '#e5e7eb',
            marginBottom: '1rem',
            marginTop: 0
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          id="dialog-message"
          style={{
            color: '#d1d5db',
            fontSize: '0.9375rem',
            lineHeight: '1.5',
            marginBottom: '2rem',
            marginTop: 0
          }}
        >
          {message}
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: `1px solid ${cancelColor}`,
              color: cancelColor,
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '0.9375rem',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = `${cancelColor}20`;
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
            aria-label="Cancel action"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isDestructive ? '#ef4444' : confirmColor,
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.9375rem',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.opacity = '0.9';
                e.target.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
              e.target.style.transform = 'scale(1)';
            }}
            aria-label="Confirm action"
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}
                />
                Loading...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;
