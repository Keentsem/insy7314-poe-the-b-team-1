/**
 * Status Badge Component
 * Displays transaction status with color coding
 */

import React from 'react';

const StatusBadge = ({ status, size = 'medium' }) => {
  const getStatusColor = status => {
    const colors = {
      pending: '#fbbf24',
      verified: '#10b981',
      rejected: '#ef4444',
      submitted_to_swift: '#3b82f6',
      completed: '#8b5cf6',
      failed: '#dc2626',
      processing: '#f59e0b',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = status => {
    const labels = {
      pending: 'Pending',
      verified: 'Verified',
      rejected: 'Rejected',
      submitted_to_swift: 'Submitted to SWIFT',
      completed: 'Completed',
      failed: 'Failed',
      processing: 'Processing',
    };
    return labels[status] || status;
  };

  const sizes = {
    small: {
      padding: '0.125rem 0.5rem',
      fontSize: '0.625rem',
    },
    medium: {
      padding: '0.25rem 0.75rem',
      fontSize: '0.75rem',
    },
    large: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
    },
  };

  const color = getStatusColor(status);
  const sizeStyle = sizes[size];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: sizeStyle.padding,
        backgroundColor: `${color}20`,
        color: color,
        borderRadius: '9999px',
        fontSize: sizeStyle.fontSize,
        fontWeight: '500',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
      role="status"
      aria-label={`Status: ${getStatusLabel(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
