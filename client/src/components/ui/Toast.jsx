/**
 * Toast Notification Wrapper
 * Provides pre-configured toast notifications using react-hot-toast
 */

import toast, { Toaster } from 'react-hot-toast';

// Pre-configured toast functions
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: 'rgba(16, 185, 129, 0.9)',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      },
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: 'rgba(239, 68, 68, 0.9)',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      },
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: 'rgba(251, 191, 36, 0.9)',
        color: '#1f2937',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      },
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: 'rgba(59, 130, 246, 0.9)',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      },
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: 'rgba(17, 24, 39, 0.9)',
        color: '#e5e7eb',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      },
      ...options,
    });
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        position: 'top-right',
        style: {
          borderRadius: '8px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '500',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        },
        ...options,
      }
    );
  },

  dismiss: toastId => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
};

// Toaster component to be added to root App component
export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        top: 20,
        right: 20,
      }}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          borderRadius: '8px',
          fontSize: '14px',
        },
      }}
    />
  );
};

export default showToast;
