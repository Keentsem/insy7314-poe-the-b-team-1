/**
 * Invoices View Component (Customer)
 * Displays customer's payment history including verification details and employee info
 */

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getSecureFetchOptions } from '../config/api';
import { LoadingSpinner, showToast, StatusBadge } from './ui';
import { FiFileText, FiDollarSign, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

const InvoicesView = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.INVOICES_CUSTOMER,
        getSecureFetchOptions('GET')
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invoices');
      }

      const userInvoices = data.invoices || [];
      setInvoices(userInvoices);

      // Calculate stats
      const stats = {
        total: userInvoices.length,
        verified: userInvoices.filter(i => i.status === 'generated' || i.status === 'sent').length,
        totalAmount: userInvoices.reduce((sum, i) => sum + i.amount, 0)
      };

      setStats(stats);
    } catch (err) {
      showToast.error(`Failed to fetch invoices: ${err.message}`);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
      case 'submitted_to_swift':
      case 'completed':
        return <FiCheckCircle style={{ color: '#10b981' }} />;
      case 'rejected':
        return <FiXCircle style={{ color: '#ef4444' }} />;
      case 'pending':
      default:
        return <FiClock style={{ color: '#f59e0b' }} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner size="large" text="Loading your invoices..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#e5e7eb', fontSize: '1.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiFileText style={{ color: '#3b82f6' }} />
          My Payment Invoices
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Complete history of all your international payment transactions
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard icon={<FiFileText />} label="Total Invoices" value={stats.total} color="#3b82f6" />
        <StatCard icon={<FiCheckCircle />} label="Verified Payments" value={stats.verified} color="#10b981" />
        <StatCard icon={<FiDollarSign />} label="Total Amount" value={`$${stats.totalAmount.toFixed(2)}`} color="#8b5cf6" />
      </div>

      {/* Invoices Table */}
      <div style={{
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <h3 style={{ color: '#e5e7eb', fontSize: '1.25rem', marginBottom: '20px', fontWeight: '600' }}>
          Payment History
        </h3>

        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <FiFileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '1.125rem' }}>No payment invoices found</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>Invoices will appear here after employees verify your payments</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Invoice #
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Date
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Recipient
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Amount
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Verified By
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Department
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.invoiceNumber} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '12px', color: '#e5e7eb', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {invoice.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px', color: '#9ca3af', fontSize: '0.875rem' }}>
                      {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                    </td>
                    <td style={{ padding: '12px', color: '#e5e7eb', fontSize: '0.875rem' }}>
                      {invoice.recipientName}
                    </td>
                    <td style={{ padding: '12px', color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>
                      {invoice.currency} {invoice.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', color: '#3b82f6', fontSize: '0.875rem', fontWeight: '500' }}>
                      {invoice.verifiedByName}
                    </td>
                    <td style={{ padding: '12px', color: '#9ca3af', fontSize: '0.875rem' }}>
                      {invoice.verifierDepartment}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
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
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
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
            if (e.target === e.currentTarget) setSelectedInvoice(null);
          }}
        >
          <div style={{
            maxWidth: '700px',
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
            {/* Invoice Header */}
            <div style={{ borderBottom: '2px solid #4338ca', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '4px' }}>
                    INVOICE
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    #{selectedInvoice.invoiceNumber}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
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
            </div>

            {/* Status Banner */}
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #10b981'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FiCheckCircle style={{ color: '#10b981' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#e5e7eb', fontWeight: '600', fontSize: '0.875rem' }}>
                    Invoice Status: Verified & Generated
                  </p>
                  <p style={{ margin: 0, color: '#10b981', fontSize: '0.75rem', marginTop: '4px' }}>
                    Payment Status: {selectedInvoice.paymentStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Invoice Date
                  </h4>
                  <p style={{ color: '#e5e7eb', fontSize: '0.875rem', margin: 0 }}>
                    {format(new Date(selectedInvoice.invoiceDate), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Currency
                  </h4>
                  <p style={{ color: '#e5e7eb', fontSize: '0.875rem', margin: 0 }}>
                    {selectedInvoice.currency}
                  </p>
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>
                <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Payment Amount
                </h4>
                <p style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {selectedInvoice.currency} {selectedInvoice.amount.toFixed(2)}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #374151', paddingTop: '20px' }}>
                <h4 style={{ color: '#e5e7eb', fontSize: '1rem', marginBottom: '12px', fontWeight: '600' }}>
                  Recipient Information
                </h4>
                <DetailRow label="Name" value={selectedInvoice.recipientName} />
                <DetailRow label="Account Number" value={maskAccount(selectedInvoice.recipientAccount)} mono />
                <DetailRow label="SWIFT Code" value={selectedInvoice.recipientSwift} mono />
                <DetailRow label="Reference" value={selectedInvoice.reference || 'N/A'} />
              </div>

              {/* Verification Info */}
              <div style={{
                borderTop: '1px solid #374151',
                paddingTop: '20px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                padding: '20px',
                borderRadius: '8px',
                marginTop: '8px'
              }}>
                <h4 style={{ color: '#e5e7eb', fontSize: '1rem', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCheckCircle style={{ color: '#10b981' }} />
                  Verified & Approved By
                </h4>
                <DetailRow label="Employee Name" value={selectedInvoice.verifiedByName} highlight />
                <DetailRow label="Employee Email" value={selectedInvoice.verifiedByEmail} />
                <DetailRow label="Department" value={selectedInvoice.verifierDepartment} />
                <DetailRow
                  label="Verification Date"
                  value={format(new Date(selectedInvoice.invoiceDate), 'MMM dd, yyyy HH:mm:ss')}
                />
                {selectedInvoice.verifierNotes && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Employee Notes
                    </label>
                    <p style={{ color: '#e5e7eb', fontSize: '0.875rem', fontStyle: 'italic', margin: 0, padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                      "{selectedInvoice.verifierNotes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #374151', paddingTop: '16px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: 0 }}>
                This is a digital invoice for your international payment transaction.
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                Invoice Number: {selectedInvoice.invoiceNumber}
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                Transaction ID: {selectedInvoice.transactionId}
              </p>
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
    padding: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      <div style={{ color, fontSize: '20px' }}>{icon}</div>
      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>{label}</p>
    </div>
    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#e5e7eb' }}>{value}</p>
  </div>
);

const DetailRow = ({ label, value, mono = false, highlight = false }) => (
  <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>
      {label}
    </label>
    <p style={{
      margin: 0,
      color: highlight ? '#3b82f6' : '#e5e7eb',
      fontSize: '0.875rem',
      fontWeight: highlight ? '600' : '400',
      fontFamily: mono ? 'monospace' : 'inherit'
    }}>
      {value}
    </p>
  </div>
);

export default InvoicesView;
