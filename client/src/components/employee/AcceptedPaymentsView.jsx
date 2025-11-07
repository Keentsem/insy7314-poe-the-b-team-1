/**
 * Accepted Payments View Component
 * Displays all accepted/verified payments from customers with employee details
 */

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getSecureFetchOptions } from '../../config/api';
import { LoadingSpinner, showToast, StatusBadge } from '../ui';
import { FiCheckCircle, FiUser, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';
import { format } from 'date-fns';

const AcceptedPaymentsView = ({ employee }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    todayCount: 0
  });

  useEffect(() => {
    if (employee) {
      fetchAcceptedPayments();
    }
  }, [employee]);

  const fetchAcceptedPayments = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.PAYMENTS_EMPLOYEE_ALL,
        getSecureFetchOptions('GET')
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payments');
      }

      // Filter for verified and completed payments BY THIS EMPLOYEE ONLY
      const acceptedPayments = (data.transactions || []).filter(
        p => (p.status === 'verified' || p.status === 'completed' || p.status === 'submitted_to_swift')
             && p.verifiedByEmail === employee.email
      );

      setPayments(acceptedPayments);

      // Calculate stats
      const totalAmount = acceptedPayments.reduce((sum, p) => sum + p.amount, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = acceptedPayments.filter(p => {
        const verifiedDate = new Date(p.verifiedAt);
        verifiedDate.setHours(0, 0, 0, 0);
        return verifiedDate.getTime() === today.getTime();
      }).length;

      setStats({
        total: acceptedPayments.length,
        totalAmount,
        todayCount
      });
    } catch (err) {
      showToast.error(`Failed to fetch payments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const maskAccount = (account) => {
    if (!account) return 'N/A';
    return account.length > 8
      ? `${account.substring(0, 4)}****${account.substring(account.length - 4)}`
      : account;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner size="large" text="Loading accepted payments..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#e5e7eb', fontSize: '1.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiCheckCircle style={{ color: '#10b981' }} />
          Accepted Payments Archive
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Payments verified by {employee?.name || 'you'} ({employee?.email})
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          icon={<FiCheckCircle />}
          label="Total Accepted"
          value={stats.total}
          color="#10b981"
        />
        <StatCard
          icon={<FiDollarSign />}
          label="Total Amount"
          value={`$${stats.totalAmount.toFixed(2)}`}
          color="#3b82f6"
        />
        <StatCard
          icon={<FiCalendar />}
          label="Accepted Today"
          value={stats.todayCount}
          color="#f59e0b"
        />
      </div>

      {/* Payments Table */}
      <div style={{
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <FiFileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '1.125rem' }}>No accepted payments found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Transaction ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Customer Name
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Customer Email
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Customer Country
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Amount
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Recipient
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Verified By
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Verified At
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.transactionId} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '12px', color: '#e5e7eb', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {payment.transactionId.substring(0, 12)}...
                    </td>
                    <td style={{ padding: '12px', color: '#e5e7eb', fontSize: '0.875rem', fontWeight: '500' }}>
                      {payment.customerName || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#e5e7eb', fontSize: '0.875rem' }}>
                      {payment.customerEmail}
                    </td>
                    <td style={{ padding: '12px', color: '#9ca3af', fontSize: '0.875rem' }}>
                      {payment.customerCountry || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>
                      {payment.currency} {payment.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', color: '#e5e7eb', fontSize: '0.875rem' }}>
                      {payment.recipientName}
                    </td>
                    <td style={{ padding: '12px', color: '#3b82f6', fontSize: '0.875rem', fontWeight: '500' }}>
                      {payment.verifiedByEmail || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#9ca3af', fontSize: '0.875rem' }}>
                      {payment.verifiedAt ? format(new Date(payment.verifiedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={payment.status} size="small" />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#4338ca',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
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
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPayment(null);
          }}
        >
          <div style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e5e7eb' }}>
                Payment Details
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
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

            <div style={{ display: 'grid', gap: '16px' }}>
              <DetailRow label="Transaction ID" value={selectedPayment.transactionId} mono />

              {/* Customer Details Section */}
              <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Details</h4>
                <DetailRow label="Customer Name" value={selectedPayment.customerName || 'N/A'} highlight />
                <DetailRow label="Customer Email" value={selectedPayment.customerEmail} />
                <DetailRow label="Customer Country" value={selectedPayment.customerCountry || 'N/A'} />
              </div>

              <DetailRow label="Amount" value={`${selectedPayment.currency} ${selectedPayment.amount.toFixed(2)}`} highlight />
              <DetailRow label="Recipient Name" value={selectedPayment.recipientName} />
              <DetailRow label="Recipient Account" value={maskAccount(selectedPayment.recipientAccount)} mono />
              <DetailRow label="SWIFT Code" value={selectedPayment.recipientSwift} mono />
              <DetailRow label="Reference" value={selectedPayment.reference || 'N/A'} />
              <DetailRow label="Status" value={<StatusBadge status={selectedPayment.status} size="medium" />} />
              <DetailRow label="Created At" value={format(new Date(selectedPayment.createdAt), 'MMM dd, yyyy HH:mm:ss')} />
              <DetailRow label="Verified By" value={selectedPayment.verifiedByEmail || 'N/A'} highlight />
              <DetailRow label="Verified At" value={selectedPayment.verifiedAt ? format(new Date(selectedPayment.verifiedAt), 'MMM dd, yyyy HH:mm:ss') : 'N/A'} />

              {selectedPayment.verifierNotes && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px' }}>
                    Verifier Notes
                  </label>
                  <p style={{ color: '#e5e7eb', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    "{selectedPayment.verifierNotes}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <div style={{ color, fontSize: '24px' }}>{icon}</div>
      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>{label}</p>
    </div>
    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#e5e7eb' }}>{value}</p>
  </div>
);

const DetailRow = ({ label, value, mono = false, highlight = false }) => (
  <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
      {label}
    </label>
    <p style={{
      margin: 0,
      color: highlight ? '#10b981' : '#e5e7eb',
      fontSize: '0.875rem',
      fontWeight: highlight ? '600' : '400',
      fontFamily: mono ? 'monospace' : 'inherit'
    }}>
      {value}
    </p>
  </div>
);

export default AcceptedPaymentsView;
