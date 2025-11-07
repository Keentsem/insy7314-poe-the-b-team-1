/**
 * Enhanced Employee Dashboard - Task 3
 * Complete UX improvements with search, filter, pagination, and real-time updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS, getSecureFetchOptions, fetchCSRFToken } from '../../config/api';
import { LoadingSpinner, StatusBadge, ConfirmDialog, showToast, CardNav, FolderIcon } from '../ui';
import { FiSearch, FiFilter, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import Cubes from './Cubes';
import CustomerListView from './CustomerListView';
import AcceptedPaymentsView from './AcceptedPaymentsView';

// Simple panel component for better visibility
const Panel = ({ children, style = {} }) => (
  <div
    style={{
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      ...style,
    }}
  >
    {children}
  </div>
);

const EmployeeDashboardEnhanced = ({ employee, onLogout }) => {
  // View state management
  const [currentView, setCurrentView] = useState('payments'); // 'payments', 'customers', or 'accepted'

  // State management
  const [activeTab, setActiveTab] = useState('pending');
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    verified: true,
    verifierNotes: '',
  });
  const [selectedForSwift, setSelectedForSwift] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  // Fetch transactions based on active tab
  const fetchTransactions = useCallback(
    async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) setLoading(true);
      setError('');

      try {
        const endpoint =
          activeTab === 'pending'
            ? API_ENDPOINTS.PAYMENTS_EMPLOYEE_PENDING
            : `${API_ENDPOINTS.PAYMENTS_EMPLOYEE_ALL}?status=${activeTab === 'all' ? '' : activeTab}`;

        const response = await fetch(endpoint, getSecureFetchOptions('GET'));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch transactions');
        }

        setTransactions(data.transactions || []);
        setLastRefresh(new Date());

        // Show success toast only on manual refresh
        if (!showLoadingSpinner && data.transactions.length > 0) {
          showToast.success(`Refreshed: ${data.transactions.length} transactions`);
        }
      } catch (err) {
        setError(err.message);
        showToast.error(`Failed to fetch transactions: ${err.message}`);
      } finally {
        if (showLoadingSpinner) setLoading(false);
      }
    },
    [activeTab]
  );

  // Initial load and tab changes
  useEffect(() => {
    fetchTransactions();
    setCurrentPage(1); // Reset to first page on tab change
  }, [activeTab, fetchTransactions]);

  // Auto-refresh every 60 seconds for pending tab
  useEffect(() => {
    if (!autoRefresh || activeTab !== 'pending') return;

    const interval = setInterval(() => {
      fetchTransactions(false); // Refresh without loading spinner
    }, 60000); // 60 seconds (1 minute)

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, fetchTransactions]);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...transactions];

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        tx =>
          tx.transactionId.toLowerCase().includes(search) ||
          tx.customerEmail.toLowerCase().includes(search) ||
          tx.recipientName.toLowerCase().includes(search) ||
          tx.amount.toString().includes(search)
      );
    }

    // Filter by currency
    if (filterCurrency !== 'all') {
      filtered = filtered.filter(tx => tx.currency === filterCurrency);
    }

    // Filter by amount range
    if (filterAmountMin) {
      filtered = filtered.filter(tx => tx.amount >= parseFloat(filterAmountMin));
    }
    if (filterAmountMax) {
      filtered = filtered.filter(tx => tx.amount <= parseFloat(filterAmountMax));
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [transactions, searchTerm, filterCurrency, filterAmountMin, filterAmountMax]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleVerifyTransaction = async () => {
    if (!selectedTransaction) {
      console.error('No transaction selected');
      return;
    }

    console.log('Verifying transaction:', selectedTransaction.transactionId);

    // Close confirmation dialog
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    setActionLoading(true);
    setError('');

    const loadingToast = showToast.loading(
      verificationForm.verified ? 'Approving payment...' : 'Rejecting payment...'
    );

    try {
      const csrfToken = await fetchCSRFToken();
      console.log('Sending verification request...');

      const response = await fetch(
        API_ENDPOINTS.PAYMENTS_EMPLOYEE_VERIFY(selectedTransaction.transactionId),
        getSecureFetchOptions('POST', verificationForm, csrfToken)
      );

      const data = await response.json();
      console.log('Verification response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      showToast.dismiss(loadingToast);
      showToast.success(
        `Payment ${verificationForm.verified ? 'approved' : 'rejected'} successfully!`
      );

      setSelectedTransaction(null);
      setVerificationForm({ verified: true, verifierNotes: '' });
      fetchTransactions(false);
    } catch (err) {
      console.error('Verification error:', err);
      showToast.dismiss(loadingToast);
      setError(err.message);
      showToast.error(`Verification failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitToSwift = async () => {
    if (selectedForSwift.size === 0) {
      showToast.warning('Please select at least one transaction to submit');
      return;
    }

    // Close confirmation dialog
    setConfirmDialog({ ...confirmDialog, isOpen: false });

    setActionLoading(true);
    setError('');

    const loadingToast = showToast.loading(
      `Submitting ${selectedForSwift.size} transaction(s) to SWIFT...`
    );

    try {
      const csrfToken = await fetchCSRFToken();
      const response = await fetch(
        API_ENDPOINTS.PAYMENTS_EMPLOYEE_SUBMIT_SWIFT,
        getSecureFetchOptions(
          'POST',
          {
            transactionIds: Array.from(selectedForSwift),
          },
          csrfToken
        )
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'SWIFT submission failed');
      }

      showToast.dismiss(loadingToast);
      showToast.success(
        `Successfully submitted ${data.results.successful.length} transaction(s) to SWIFT!`,
        { duration: 5000 }
      );

      setSelectedForSwift(new Set());
      fetchTransactions(false);
    } catch (err) {
      showToast.dismiss(loadingToast);
      setError(err.message);
      showToast.error(`SWIFT submission failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const openVerifyDialog = (tx, isApproval, notes = '') => {
    console.log('Opening verify dialog for:', tx.transactionId, 'Approval:', isApproval);

    const verificationData = {
      verified: isApproval,
      verifierNotes: notes,
    };

    setSelectedTransaction(tx);
    setVerificationForm(verificationData);

    // Create closure with current transaction and form data
    const handleConfirm = async () => {
      console.log('Verifying transaction:', tx.transactionId);

      // Close confirmation dialog
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));

      setActionLoading(true);
      setError('');

      const loadingToast = showToast.loading(
        isApproval ? 'Approving payment...' : 'Rejecting payment...'
      );

      try {
        const csrfToken = await fetchCSRFToken();
        console.log('Sending verification request...');

        const response = await fetch(
          API_ENDPOINTS.PAYMENTS_EMPLOYEE_VERIFY(tx.transactionId),
          getSecureFetchOptions('POST', verificationData, csrfToken)
        );

        const data = await response.json();
        console.log('Verification response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        showToast.dismiss(loadingToast);
        showToast.success(`Payment ${isApproval ? 'approved' : 'rejected'} successfully!`);

        setSelectedTransaction(null);
        setVerificationForm({ verified: true, verifierNotes: '' });
        fetchTransactions(false);
      } catch (err) {
        console.error('Verification error:', err);
        showToast.dismiss(loadingToast);
        setError(err.message);
        showToast.error(`Verification failed: ${err.message}`);
      } finally {
        setActionLoading(false);
      }
    };

    setConfirmDialog({
      isOpen: true,
      title: isApproval ? 'Approve Payment' : 'Reject Payment',
      message: `Are you sure you want to ${isApproval ? 'approve' : 'reject'} this payment of ${tx.currency} ${tx.amount.toFixed(2)} to ${tx.recipientName}?`,
      onConfirm: handleConfirm,
      isDestructive: !isApproval,
    });
  };

  const openSwiftDialog = () => {
    const selectedTxs = Array.from(selectedForSwift)
      .map(id => transactions.find(tx => tx.transactionId === id))
      .filter(Boolean);

    const totalAmount = selectedTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const currencies = [...new Set(selectedTxs.map(tx => tx.currency))];

    setConfirmDialog({
      isOpen: true,
      title: 'Submit to SWIFT',
      message: `You are about to submit ${selectedForSwift.size} transaction(s) totaling ${totalAmount.toFixed(2)} across ${currencies.join(', ')} to SWIFT. This action cannot be undone.`,
      onConfirm: handleSubmitToSwift,
      confirmText: 'Submit to SWIFT',
      isDestructive: false,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCurrency('all');
    setFilterAmountMin('');
    setFilterAmountMax('');
    showToast.info('Filters cleared');
  };

  const maskAccount = account => {
    if (!account || account.length < 8) return account;
    return `${account.substring(0, 4)}****${account.substring(account.length - 4)}`;
  };

  // Navigation items for CardNav
  const navItems = [
    {
      label: 'Payments',
      bgColor: '#0D0716',
      textColor: '#fff',
      links: [
        {
          label: 'Pending Payments',
          ariaLabel: 'View Pending Payments',
          onClick: () => {
            setCurrentView('payments');
            setActiveTab('pending');
          },
        },
        {
          label: 'All Payments',
          ariaLabel: 'View All Payments',
          onClick: () => {
            setCurrentView('payments');
            setActiveTab('all');
          },
        },
        {
          label: 'Accepted Archive',
          ariaLabel: 'View Accepted Payments Archive',
          onClick: () => setCurrentView('accepted'),
        },
      ],
    },
    {
      label: 'Customers',
      bgColor: '#170D27',
      textColor: '#fff',
      links: [
        {
          label: 'Customer Directory',
          ariaLabel: 'View Customer Directory',
          onClick: () => setCurrentView('customers'),
        },
      ],
    },
    {
      label: 'Account',
      bgColor: '#271E37',
      textColor: '#fff',
      links: [
        {
          label: 'Profile',
          ariaLabel: 'View Profile',
          onClick: () => {
            setCurrentView('payments');
            setActiveTab('pending');
          },
        },
        { label: 'Logout', ariaLabel: 'Logout', onClick: onLogout },
      ],
    },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        minHeight: '100vh',
        overflow: 'auto',
        backgroundColor: '#0a0e1a',
      }}
    >
      {/* Navigation - Fixed to top */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <CardNav
          logo="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%236366f1'/%3E%3Ctext x='50' y='60' font-size='40' fill='white' text-anchor='middle' font-weight='bold'%3EP%3C/text%3E%3C/svg%3E"
          logoAlt="Payment Portal"
          items={navItems}
          baseColor="rgba(17, 24, 39, 0.95)"
          menuColor="#e5e7eb"
          buttonBgColor="#6366f1"
          buttonTextColor="#fff"
          onButtonClick={() => setCurrentView('payments')}
        />
      </div>

      {/* Cubes Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 0.15,
        }}
      >
        <Cubes
          gridSize={8}
          faceColor="#0f1419"
          rippleColor="#3b82f6"
          border="1px solid #1e3a5f"
          autoAnimate={false}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '2rem', paddingTop: '6rem' }}>
        {/* Show different views based on currentView state */}
        {currentView === 'customers' ? (
          <CustomerListView />
        ) : currentView === 'accepted' ? (
          <AcceptedPaymentsView employee={employee} />
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <Panel>
                <div
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h1
                      style={{
                        fontSize: '1.875rem',
                        fontWeight: 'bold',
                        color: '#f3f4f6',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Employee Payment Portal
                    </h1>
                    <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                      {employee.name} • {employee.department} • {employee.email}
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Last refresh: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.target.style.backgroundColor = '#dc2626')}
                    onMouseLeave={e => (e.target.style.backgroundColor = '#ef4444')}
                  >
                    Logout
                  </button>
                </div>

                {/* Folder Navigation - Left aligned under header */}
                <div
                  style={{
                    marginTop: '2rem',
                    paddingBottom: '1rem',
                    paddingLeft: '4rem',
                    paddingRight: '2rem',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: '32px',
                  }}
                >
                  <FolderIcon
                    color="#667eea"
                    size={1.5}
                    label="Accepted Payments"
                    count={
                      transactions.filter(
                        t =>
                          t.status === 'verified' ||
                          t.status === 'completed' ||
                          t.status === 'submitted_to_swift'
                      ).length
                    }
                    onClick={() => setCurrentView('accepted')}
                  />
                </div>
              </Panel>
            </div>

            {/* Tabs */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Panel>
                <div
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {['pending', 'verified', 'submitted_to_swift', 'all'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: activeTab === tab ? '#4338ca' : 'transparent',
                          color: activeTab === tab ? '#fff' : '#9ca3af',
                          border: `1px solid ${activeTab === tab ? '#4338ca' : '#374151'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {tab.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => fetchTransactions(false)}
                      disabled={loading}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #4338ca',
                        color: '#4338ca',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                      title="Refresh transactions"
                    >
                      <FiRefreshCw size={16} />
                    </button>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#e5e7eb',
                        fontSize: '0.875rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={e => {
                          setAutoRefresh(e.target.checked);
                          showToast.info(
                            e.target.checked ? 'Auto-refresh enabled' : 'Auto-refresh disabled'
                          );
                        }}
                      />
                      Auto-refresh
                    </label>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Search and Filters */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Panel>
                <div style={{ padding: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: showFilters ? '1rem' : 0,
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Search */}
                    <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                      <FiSearch
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search by ID, email, recipient, amount..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                          backgroundColor: 'rgba(17, 24, 39, 0.8)',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#e5e7eb',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>

                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: showFilters ? '#4338ca' : 'transparent',
                        border: '1px solid #4338ca',
                        color: showFilters ? '#fff' : '#4338ca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '500',
                      }}
                    >
                      <FiFilter size={16} />
                      Filters
                    </button>

                    {(searchTerm ||
                      filterCurrency !== 'all' ||
                      filterAmountMin ||
                      filterAmountMax) && (
                      <button
                        onClick={clearFilters}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'transparent',
                          border: '1px solid #6b7280',
                          color: '#9ca3af',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Advanced Filters */}
                  {showFilters && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #374151',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Currency
                        </label>
                        <select
                          value={filterCurrency}
                          onChange={e => setFilterCurrency(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#e5e7eb',
                            fontSize: '0.875rem',
                          }}
                        >
                          <option value="all">All Currencies</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="ZAR">ZAR</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Min Amount
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={filterAmountMin}
                          onChange={e => setFilterAmountMin(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#e5e7eb',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Max Amount
                        </label>
                        <input
                          type="number"
                          placeholder="10000.00"
                          value={filterAmountMax}
                          onChange={e => setFilterAmountMax(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#e5e7eb',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Results count */}
                  <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                    Showing {indexOfFirstItem + 1}-
                    {Math.min(indexOfLastItem, filteredTransactions.length)} of{' '}
                    {filteredTransactions.length} transactions
                    {filteredTransactions.length !== transactions.length &&
                      ` (filtered from ${transactions.length})`}
                  </div>
                </div>
              </Panel>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            {/* SWIFT Submission Button */}
            {activeTab === 'verified' && selectedForSwift.size > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <Panel>
                  <div
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#e5e7eb' }}>
                      {selectedForSwift.size} transaction(s) selected
                    </span>
                    <button
                      onClick={openSwiftDialog}
                      disabled={actionLoading}
                      style={{
                        padding: '0.5rem 1.5rem',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        opacity: actionLoading ? 0.7 : 1,
                      }}
                    >
                      Submit to SWIFT
                    </button>
                  </div>
                </Panel>
              </div>
            )}

            {/* Transactions Table */}
            <Panel>
              <div style={{ padding: '1.5rem' }}>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#e5e7eb',
                    marginBottom: '1rem',
                  }}
                >
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}{' '}
                  Transactions
                </h2>

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <LoadingSpinner size="large" text="Loading transactions..." />
                  </div>
                ) : currentTransactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                      No transactions found
                    </p>
                    {(searchTerm ||
                      filterCurrency !== 'all' ||
                      filterAmountMin ||
                      filterAmountMax) && (
                      <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #374151' }}>
                            {activeTab === 'verified' && (
                              <th
                                style={{
                                  padding: '0.75rem',
                                  textAlign: 'left',
                                  color: '#9ca3af',
                                  fontSize: '0.875rem',
                                }}
                              >
                                Select
                              </th>
                            )}
                            <th
                              style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                              }}
                            >
                              ID
                            </th>
                            <th
                              style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                              }}
                            >
                              Customer
                            </th>
                            <th
                              style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                              }}
                            >
                              Amount
                            </th>
                            <th
                              style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                              }}
                            >
                              Recipient
                            </th>
                            <th
                              style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                              }}
                            >
                              Account
                            </th>
                            <th
                              style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                              }}
                            >
                              Status
                            </th>
                            <th
                              style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                              }}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTransactions.map(tx => (
                            <tr
                              key={tx.transactionId}
                              style={{ borderBottom: '1px solid #1f2937' }}
                            >
                              {activeTab === 'verified' && (
                                <td style={{ padding: '0.75rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedForSwift.has(tx.transactionId)}
                                    onChange={e => {
                                      const newSet = new Set(selectedForSwift);
                                      if (e.target.checked) {
                                        newSet.add(tx.transactionId);
                                      } else {
                                        newSet.delete(tx.transactionId);
                                      }
                                      setSelectedForSwift(newSet);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  />
                                </td>
                              )}
                              <td
                                style={{
                                  padding: '0.75rem',
                                  color: '#e5e7eb',
                                  fontSize: '0.875rem',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {tx.transactionId.substring(0, 12)}...
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem',
                                  color: '#e5e7eb',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {tx.customerEmail}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem',
                                  color: '#e5e7eb',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                }}
                              >
                                {tx.currency} {tx.amount.toFixed(2)}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem',
                                  color: '#e5e7eb',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {tx.recipientName}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem',
                                  color: '#9ca3af',
                                  fontSize: '0.875rem',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {maskAccount(tx.recipientAccount)}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <StatusBadge status={tx.status} size="small" />
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                {tx.status === 'pending' ? (
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => openVerifyDialog(tx, true)}
                                      disabled={actionLoading}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                      }}
                                      title="Approve payment"
                                    >
                                      <FiCheck size={12} />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => openVerifyDialog(tx, false)}
                                      disabled={actionLoading}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                      }}
                                      title="Reject payment"
                                    >
                                      <FiX size={12} />
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedTransaction(tx)}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      backgroundColor: '#4338ca',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    Details
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div
                        style={{
                          marginTop: '1.5rem',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: currentPage === 1 ? 'transparent' : '#4338ca',
                            border: '1px solid #4338ca',
                            color: currentPage === 1 ? '#6b7280' : '#fff',
                            borderRadius: '6px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Previous
                        </button>

                        <span style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                          Page {currentPage} of {totalPages}
                        </span>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: currentPage === totalPages ? 'transparent' : '#4338ca',
                            border: '1px solid #4338ca',
                            color: currentPage === totalPages ? '#6b7280' : '#fff',
                            borderRadius: '6px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Panel>

            {/* Transaction Details Modal */}
            {selectedTransaction && !confirmDialog.isOpen && (
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
                  zIndex: 50,
                  padding: '1rem',
                }}
                onClick={e => {
                  if (e.target === e.currentTarget) setSelectedTransaction(null);
                }}
              >
                <div
                  style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
                >
                  <Panel>
                    <div style={{ padding: '2rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1.5rem',
                        }}
                      >
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e5e7eb' }}>
                          Transaction Details
                        </h3>
                        <button
                          onClick={() => setSelectedTransaction(null)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </div>

                      <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Transaction ID
                          </label>
                          <p
                            style={{
                              color: '#e5e7eb',
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                            }}
                          >
                            {selectedTransaction.id}
                          </p>
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Customer Email
                          </label>
                          <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                            {selectedTransaction.customerEmail}
                          </p>
                        </div>
                        <div
                          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                        >
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                marginBottom: '0.25rem',
                              }}
                            >
                              Amount
                            </label>
                            <p
                              style={{ color: '#e5e7eb', fontSize: '1.25rem', fontWeight: 'bold' }}
                            >
                              {selectedTransaction.currency} {selectedTransaction.amount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                marginBottom: '0.25rem',
                              }}
                            >
                              Status
                            </label>
                            <StatusBadge status={selectedTransaction.status} size="medium" />
                          </div>
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Recipient Name
                          </label>
                          <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                            {selectedTransaction.recipientName}
                          </p>
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Recipient Account (IBAN)
                          </label>
                          <p
                            style={{
                              color: '#e5e7eb',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                            }}
                          >
                            {selectedTransaction.recipientAccount}
                          </p>
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              marginBottom: '0.25rem',
                            }}
                          >
                            SWIFT Code
                          </label>
                          <p
                            style={{
                              color: '#e5e7eb',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                            }}
                          >
                            {selectedTransaction.recipientSwift}
                          </p>
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Reference
                          </label>
                          <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                            {selectedTransaction.reference || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Created At
                          </label>
                          <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                            {new Date(selectedTransaction.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {selectedTransaction.verifiedBy && (
                          <>
                            <div>
                              <label
                                style={{
                                  display: 'block',
                                  fontSize: '0.75rem',
                                  color: '#9ca3af',
                                  marginBottom: '0.25rem',
                                }}
                              >
                                Verified By
                              </label>
                              <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                                {selectedTransaction.verifiedBy}
                              </p>
                            </div>
                            {selectedTransaction.verifierNotes && (
                              <div>
                                <label
                                  style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    color: '#9ca3af',
                                    marginBottom: '0.25rem',
                                  }}
                                >
                                  Verifier Notes
                                </label>
                                <p
                                  style={{
                                    color: '#e5e7eb',
                                    fontSize: '0.875rem',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  {selectedTransaction.verifierNotes}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {selectedTransaction.status === 'pending' && (
                        <div
                          style={{
                            marginTop: '2rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid #374151',
                          }}
                        >
                          <h4
                            style={{
                              fontSize: '1.125rem',
                              fontWeight: '600',
                              color: '#e5e7eb',
                              marginBottom: '1rem',
                            }}
                          >
                            Verification
                          </h4>
                          <div style={{ marginBottom: '1rem' }}>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                color: '#e5e7eb',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Verifier Notes (Optional)
                            </label>
                            <textarea
                              value={verificationForm.verifierNotes}
                              onChange={e =>
                                setVerificationForm(prev => ({
                                  ...prev,
                                  verifierNotes: e.target.value,
                                }))
                              }
                              placeholder="Add any notes about this verification..."
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                border: '1px solid #374151',
                                borderRadius: '6px',
                                color: '#e5e7eb',
                                fontSize: '0.875rem',
                                minHeight: '100px',
                                resize: 'vertical',
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                              onClick={() => {
                                openVerifyDialog(
                                  selectedTransaction,
                                  true,
                                  verificationForm.verifierNotes
                                );
                              }}
                              disabled={actionLoading}
                              style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem',
                              }}
                            >
                              Approve Payment
                            </button>
                            <button
                              onClick={() => {
                                openVerifyDialog(
                                  selectedTransaction,
                                  false,
                                  verificationForm.verifierNotes
                                );
                              }}
                              disabled={actionLoading}
                              style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem',
                              }}
                            >
                              Reject Payment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Panel>
                </div>
              </div>
            )}
          </>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText || 'Confirm'}
          isDestructive={confirmDialog.isDestructive}
          loading={actionLoading}
        />
      </div>
    </div>
  );
};

export default EmployeeDashboardEnhanced;
