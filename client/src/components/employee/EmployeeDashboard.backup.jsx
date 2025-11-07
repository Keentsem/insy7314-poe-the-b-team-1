/**
 * Employee Dashboard - Task 3
 * Main dashboard for employees to view and verify payments
 */

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getSecureFetchOptions, fetchCSRFToken } from '../../config/api';
import Cubes from './Cubes';

// Simple panel component for better visibility
const Panel = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    ...style
  }}>
    {children}
  </div>
);

const EmployeeDashboard = ({ employee, onLogout }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    verified: true,
    verifierNotes: ''
  });
  const [selectedForSwift, setSelectedForSwift] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch transactions based on active tab
  useEffect(() => {
    fetchTransactions();
  }, [activeTab]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = activeTab === 'pending'
        ? API_ENDPOINTS.PAYMENTS_EMPLOYEE_PENDING
        : `${API_ENDPOINTS.PAYMENTS_EMPLOYEE_ALL}?status=${activeTab === 'all' ? '' : activeTab}`;

      const response = await fetch(endpoint, getSecureFetchOptions('GET'));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTransaction = async () => {
    if (!selectedTransaction) return;

    setActionLoading(true);
    setError('');

    try {
      const csrfToken = await fetchCSRFToken();
      const response = await fetch(
        API_ENDPOINTS.PAYMENTS_EMPLOYEE_VERIFY(selectedTransaction.id),
        getSecureFetchOptions('POST', verificationForm, csrfToken)
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      alert(`Payment ${verificationForm.verified ? 'verified' : 'rejected'} successfully!`);
      setSelectedTransaction(null);
      setVerificationForm({ verified: true, verifierNotes: '' });
      fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitToSwift = async () => {
    if (selectedForSwift.size === 0) {
      alert('Please select at least one transaction to submit');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const csrfToken = await fetchCSRFToken();
      const response = await fetch(
        API_ENDPOINTS.PAYMENTS_EMPLOYEE_SUBMIT_SWIFT,
        getSecureFetchOptions('POST', {
          transactionIds: Array.from(selectedForSwift)
        }, csrfToken)
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'SWIFT submission failed');
      }

      alert(`Successfully submitted ${data.results.successful.length} transaction(s) to SWIFT`);
      setSelectedForSwift(new Set());
      fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const maskAccount = (account) => {
    if (!account || account.length < 8) return account;
    return `${account.substring(0, 4)}****${account.substring(account.length - 4)}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      verified: '#10b981',
      rejected: '#ef4444',
      submitted_to_swift: '#3b82f6',
      completed: '#8b5cf6',
      failed: '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      overflow: 'auto',
      backgroundColor: '#0a0e1a'
    }}>
      {/* Cubes Background with low opacity */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.15
      }}>
        <Cubes gridSize={8} faceColor="#0f1419" rippleColor="#3b82f6" border="1px solid #1e3a5f" autoAnimate={false} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Panel>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.5rem' }}>
                  Employee Payment Portal
                </h1>
                <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                  {employee.name} • {employee.department} • {employee.email}
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
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                Logout
              </button>
            </div>
          </Panel>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Panel>
            <div style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
                    transition: 'all 0.3s ease'
                  }}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#f87171'
          }}>
            {error}
          </div>
        )}

        {/* SWIFT Submission Button */}
        {activeTab === 'verified' && selectedForSwift.size > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Panel>
              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e5e7eb' }}>{selectedForSwift.size} transaction(s) selected</span>
                <button
                  onClick={handleSubmitToSwift}
                  disabled={actionLoading}
                  style={{
                    padding: '0.5rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {actionLoading ? 'Submitting...' : 'Submit to SWIFT'}
                </button>
              </div>
            </Panel>
          </div>
        )}

        {/* Transactions Table */}
        <Panel>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#e5e7eb', marginBottom: '1rem' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Transactions
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                No transactions found
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #374151' }}>
                      {activeTab === 'verified' && (
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                          Select
                        </th>
                      )}
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                        ID
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                        Customer
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                        Amount
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                        Recipient
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                        Account
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                        SWIFT
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                        Status
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #1f2937' }}>
                        {activeTab === 'verified' && (
                          <td style={{ padding: '0.75rem' }}>
                            <input
                              type="checkbox"
                              checked={selectedForSwift.has(tx.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedForSwift);
                                if (e.target.checked) {
                                  newSet.add(tx.id);
                                } else {
                                  newSet.delete(tx.id);
                                }
                                setSelectedForSwift(newSet);
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                        )}
                        <td style={{ padding: '0.75rem', color: '#e5e7eb', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                          {tx.id.substring(0, 12)}...
                        </td>
                        <td style={{ padding: '0.75rem', color: '#e5e7eb', fontSize: '0.875rem' }}>
                          {tx.customerEmail}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#e5e7eb', fontSize: '0.875rem', fontWeight: '600' }}>
                          {tx.currency} {tx.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#e5e7eb', fontSize: '0.875rem' }}>
                          {tx.recipientName}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                          {maskAccount(tx.recipientAccount)}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                          {tx.recipientSwift}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: `${getStatusColor(tx.status)}20`,
                            color: getStatusColor(tx.status),
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => setSelectedTransaction(tx)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#4338ca',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Panel>

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div style={{
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
            padding: '1rem'
          }}>
            <div style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
              <Panel>
                <div style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                        Transaction ID
                      </label>
                      <p style={{ color: '#e5e7eb', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {selectedTransaction.id}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                        Customer Email
                      </label>
                      <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                        {selectedTransaction.customerEmail}
                      </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                          Amount
                        </label>
                        <p style={{ color: '#e5e7eb', fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {selectedTransaction.currency} {selectedTransaction.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                          Status
                        </label>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.5rem 1rem',
                          backgroundColor: `${getStatusColor(selectedTransaction.status)}20`,
                          color: getStatusColor(selectedTransaction.status),
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {selectedTransaction.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                        Recipient Name
                      </label>
                      <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                        {selectedTransaction.recipientName}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                        Recipient Account (IBAN)
                      </label>
                      <p style={{ color: '#e5e7eb', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {selectedTransaction.recipientAccount}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                        SWIFT Code
                      </label>
                      <p style={{ color: '#e5e7eb', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {selectedTransaction.recipientSwift}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                        Reference
                      </label>
                      <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                        {selectedTransaction.reference || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                        Created At
                      </label>
                      <p style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>
                        {new Date(selectedTransaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.status === 'pending' && (
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #374151' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#e5e7eb', marginBottom: '1rem' }}>
                        Verification
                      </h4>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#e5e7eb', marginBottom: '0.5rem' }}>
                          Decision
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e5e7eb', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={verificationForm.verified === true}
                              onChange={() => setVerificationForm(prev => ({ ...prev, verified: true }))}
                            />
                            Approve
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e5e7eb', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={verificationForm.verified === false}
                              onChange={() => setVerificationForm(prev => ({ ...prev, verified: false }))}
                            />
                            Reject
                          </label>
                        </div>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#e5e7eb', marginBottom: '0.5rem' }}>
                          Verifier Notes (Optional)
                        </label>
                        <textarea
                          value={verificationForm.verifierNotes}
                          onChange={(e) => setVerificationForm(prev => ({ ...prev, verifierNotes: e.target.value }))}
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
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      <button
                        onClick={handleVerifyTransaction}
                        disabled={actionLoading}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: verificationForm.verified ? '#10b981' : '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}
                      >
                        {actionLoading ? 'Processing...' : (verificationForm.verified ? 'Approve Payment' : 'Reject Payment')}
                      </button>
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
