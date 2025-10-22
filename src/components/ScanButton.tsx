import React, { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';

const ScanButton: React.FC = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsScannerOpen(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          backgroundColor: '#f05e23',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          width: '120px',
          height: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <rect x="2" y="6" width="1.5" height="12" />
          <rect x="5" y="6" width="1" height="12" />
          <rect x="7.5" y="6" width="2" height="12" />
          <rect x="11" y="6" width="1" height="12" />
          <rect x="13.5" y="6" width="1.5" height="12" />
          <rect x="16" y="6" width="1" height="12" />
          <rect x="18.5" y="6" width="2.5" height="12" />
        </svg>
        <span style={{ fontSize: '14px', marginLeft: '8px' }}>Scan</span>
      </button>
      {isScannerOpen && <BarcodeScanner onClose={() => setIsScannerOpen(false)} />}
    </>
  );
};

export default ScanButton;
