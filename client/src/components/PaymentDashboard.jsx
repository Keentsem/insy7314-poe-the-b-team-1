import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import TransactionHistory from './TransactionHistory';
import ASCIIText from './ASCIIText';
import FaultyTerminal from './FaultyTerminal';

const PaymentDashboard = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState([]);

  const handlePaymentComplete = (transaction) => {
    setTransactions(prev => [transaction, ...prev]);
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
        <div className="dashboard-grid">
          <PaymentForm
            userId={user.id}
            onPaymentComplete={handlePaymentComplete}
          />

          <TransactionHistory transactions={transactions} />
        </div>
      </div>
      </div>
    </>
  );
};

export default PaymentDashboard;