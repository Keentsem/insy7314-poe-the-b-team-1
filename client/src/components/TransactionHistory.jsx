import React from 'react';
import GlassSurface from './GlassSurface';
import ElectricBorder from './ElectricBorder';

const TransactionHistory = ({ transactions }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'processing': return '#17a2b8';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const maskAccount = (account) => {
    if (!account || account.length < 8) return account;
    return account.slice(0, 4) + '*'.repeat(account.length - 8) + account.slice(-4);
  };

  return (
    <ElectricBorder
      color="#a7c1a8"
      speed={0.8}
      chaos={0.6}
      thickness={2}
      style={{ borderRadius: 16 }}
    >
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={16}
        blur={11}
        displace={0.5}
        distortionScale={-180}
        redOffset={0}
        greenOffset={10}
        blueOffset={20}
        brightness={80}
        opacity={0.93}
        backgroundOpacity={0.15}
        saturation={1.3}
        mixBlendMode="normal"
        className="transaction-history"
      >
      <h3>Recent Transactions</h3>

      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions yet</p>
          <p className="hint">Complete your first payment to see transaction history</p>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-header">
                <div className="transaction-id">
                  <strong>ID: {transaction.id}</strong>
                </div>
                <div
                  className="transaction-status"
                  style={{ color: getStatusColor(transaction.status) }}
                >
                  {transaction.status.toUpperCase()}
                </div>
              </div>

              <div className="transaction-details">
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">
                    {transaction.amount} {transaction.currency}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Recipient:</span>
                  <span className="value">{transaction.recipientName}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Account:</span>
                  <span className="value">{maskAccount(transaction.recipientAccount)}</span>
                </div>

                <div className="detail-row">
                  <span className="label">SWIFT:</span>
                  <span className="value">{transaction.recipientSwift}</span>
                </div>

                {transaction.reference && (
                  <div className="detail-row">
                    <span className="label">Reference:</span>
                    <span className="value">{transaction.reference}</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="label">Date:</span>
                  <span className="value">{formatDate(transaction.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </GlassSurface>
    </ElectricBorder>
  );
};

export default TransactionHistory;