import React, { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';
import TransactionHistory from './TransactionHistory';
import ASCIIText from './ASCIIText';
import FaultyTerminal from './FaultyTerminal';
import InvoicesView from './InvoicesView';
import { FolderIcon } from './ui';
import { API_ENDPOINTS, getSecureFetchOptions } from '../config/api';

const PaymentDashboard = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'invoices'
  const [invoiceCount, setInvoiceCount] = useState(0);

  useEffect(() => {
    fetchInvoiceCount();
  }, []);

  const fetchInvoiceCount = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.PAYMENTS,
        getSecureFetchOptions('GET')
      );
      const data = await response.json();
      if (response.ok && data.payments) {
        setInvoiceCount(data.payments.length);
      }
    } catch (err) {
      console.error('Failed to fetch invoice count:', err);
    }
  };

  const handlePaymentComplete = (transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    // Update invoice count when a new payment is made
    setInvoiceCount(prev => prev + 1);
  };

  return (
    <>
      {/* FaultyTerminal Background - Full Viewport Coverage */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <FaultyTerminal
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.5}
          pause={false}
          scanlineIntensity={0.5}
          glitchAmount={0.3}
          flickerAmount={0.3}
          noiseAmp={0.3}
          chromaticAberration={0}
          dither={0}
          curvature={0}
          tint="#a7c1a8"
          mouseReact={false}
          mouseStrength={0}
          pageLoadAnimation={false}
          brightness={1}
          dpr={1}
        />
      </div>

      <div className="dashboard-container" style={{ position: 'relative', zIndex: 1 }}>

      <header className="dashboard-header">
        <div className="ascii-header-container" style={{ pointerEvents: 'auto' }}>
          <ASCIIText
            text="welcome"
            enableWaves={false}
            asciiFontSize={0.75}
          />
        </div>

        <div className="header-overlay">
          <div className="user-info">
            <span>Welcome, {user.email}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Conditional View Rendering */}
        {currentView === 'invoices' ? (
          <InvoicesView />
        ) : (
          <div className="dashboard-grid">
            <PaymentForm
              userId={user.id}
              onPaymentComplete={handlePaymentComplete}
            />

            <div>
              <TransactionHistory transactions={transactions} />

              {/* Folder Navigation - Below Transaction History with spacing */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px 20px 20px', marginTop: '40px' }}>
                <FolderIcon
                  color="#3b82f6"
                  size={2}
                  label="My Invoices"
                  count={invoiceCount}
                  onClick={() => setCurrentView(currentView === 'invoices' ? 'dashboard' : 'invoices')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default PaymentDashboard;