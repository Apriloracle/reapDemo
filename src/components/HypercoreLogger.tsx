import React, { useState, useEffect } from 'react';

const HypercoreLogger: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [coordinate, setCoordinate] = useState('115792089237316195423570985008687907853269984665640564039457584007913129639935');
  const [privateKey, setPrivateKey] = useState('');
  const [targetMetadata, setTargetMetadata] = useState(JSON.stringify({ 
    metadata: { protocol: 'x402', maxAmountRequired: "10000", payTo: "0x123", network: "base" }, 
    endpoints: { primary: "https://nut402.codenut.xyz/api/mint" } 
  }, null, 2));

  useEffect(() => {
    // Connect to Server-Sent Events endpoint
    const eventSource = new EventSource('/api/hypercore/logs');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs(prevLogs => [...prevLogs, data.log]);
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  const startAgent = () => {
    fetch('/api/hypercore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'agent', coordinate }),
    });
  };

  const startManager = () => {
    try {
      fetch('/api/hypercore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'manager', 
          coordinate, 
          privateKey, 
          targetMetadata: JSON.parse(targetMetadata) 
        }),
      });
    } catch (error) {
      console.error('Invalid JSON in targetMetadata:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Hypercore Logs</h2>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" 
            value={coordinate} 
            onChange={e => setCoordinate(e.target.value)} 
            placeholder="Coordinate" 
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
          />
          <button onClick={startAgent} style={{ padding: '8px 16px' }}>
            Start Agent
          </button>
        </div>
        <div>
          <input 
            type="text" 
            value={privateKey} 
            onChange={e => setPrivateKey(e.target.value)} 
            placeholder="Private Key" 
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
          />
          <textarea 
            value={targetMetadata} 
            onChange={e => setTargetMetadata(e.target.value)} 
            placeholder="Target Metadata" 
            rows={5}
            style={{ width: '100%', padding: '8px', marginBottom: '8px', fontFamily: 'monospace' }}
          />
          <button onClick={startManager} style={{ padding: '8px 16px' }}>
            Start Manager
          </button>
        </div>
      </div>
      <pre style={{ 
        backgroundColor: '#1e1e1e', 
        color: '#00ff00', 
        padding: '15px', 
        borderRadius: '5px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {logs.join('\n')}
      </pre>
    </div>
  );
};

export default HypercoreLogger;
