import React, { useState, useEffect } from 'react';
import { hypercoreClient } from '../lib/hypercore-client';

const HypercoreLogger: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [coordinate, setCoordinate] = useState('115792089237316195423570985008687907853269984665640564039457584007913129639935');
  const [privateKey, setPrivateKey] = useState('');
  const [targetMetadata, setTargetMetadata] = useState(JSON.stringify({ 
    metadata: { protocol: 'x402', maxAmountRequired: "10000000", payTo: "0x123", network: "base" }, 
    endpoints: { primary: "https://nut402.codenut.xyz/api/mint" } 
  }, null, 2));
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState({ active: false, sessions: 0, peers: 0 });

  useEffect(() => {
    // Connect to WebSocket
    hypercoreClient.connect();
    setConnected(true);

    // Listen for logs
    const unsubscribeLogs = hypercoreClient.on('log', (data) => {
      setLogs(prev => [...prev, data.message || data.log]);
    });

    // Listen for price updates
    const unsubscribePrice = hypercoreClient.on('priceReceived', (data) => {
      setLogs(prev => [...prev, `💰 PRICE: $${data.price} ${data.asset} on ${data.network}`]);
    });

    // Fetch initial status
    hypercoreClient.getStatus().then(setStatus);

    // Poll status every 5 seconds
    const statusInterval = setInterval(() => {
      hypercoreClient.getStatus().then(setStatus);
    }, 5000);

    return () => {
      unsubscribeLogs();
      unsubscribePrice();
      clearInterval(statusInterval);
      hypercoreClient.disconnect();
    };
  }, []);

  const startAgent = async () => {
    try {
      await hypercoreClient.startAgent(coordinate);
    } catch (error: any) {
      setLogs(prev => [...prev, `❌ Error: ${error.message}`]);
    }
  };

  const startManager = async () => {
    try {
      await hypercoreClient.startManager(
        coordinate, 
        privateKey, 
        JSON.parse(targetMetadata)
      );
    } catch (error: any) {
      setLogs(prev => [...prev, `❌ Error: ${error.message}`]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>🌐 Hypercore P2P Agent Controller</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: connected ? '#d4edda' : '#f8d7da',
        borderRadius: '8px',
        border: `1px solid ${connected ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Status:</strong> {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          <div>
            <strong>Active Sessions:</strong> {status.sessions} | <strong>Peers:</strong> {status.peers}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>🤖 Start as Agent A (Seller)</h3>
        <input
          type="text"
          value={coordinate}
          onChange={e => setCoordinate(e.target.value)}
          placeholder="Coordinate"
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginBottom: '10px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        />
        <button 
          onClick={startAgent} 
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🚀 Start Agent
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>🎯 Start as Agent B (Manager/Buyer)</h3>
        <input
          type="text"
          value={privateKey}
          onChange={e => setPrivateKey(e.target.value)}
          placeholder="Private Key (optional for testing)"
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginBottom: '10px',
            fontSize: '14px'
          }}
        />
        <textarea
          value={targetMetadata}
          onChange={e => setTargetMetadata(e.target.value)}
          rows={8}
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginBottom: '10px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
        <button 
          onClick={startManager} 
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🎯 Start Manager
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>📜 Activity Log</h3>
        <pre style={{
          backgroundColor: '#1e1e1e',
          color: '#00ff00',
          padding: '15px',
          borderRadius: '5px',
          maxHeight: '500px',
          overflow: 'auto',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          {logs.length === 0 ? 'Waiting for activity...' : logs.join('\n')}
        </pre>
      </div>
    </div>
  );
};

export default HypercoreLogger;
