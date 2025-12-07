// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { hypercoreService } from '../services/HypercoreService';

const HypercoreLogger: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [coordinate, setCoordinate] = useState('115792089237316195423570985008687907853269984665640564039457584007913129639935');
  const [privateKey, setPrivateKey] = useState('');
  const [targetMetadata, setTargetMetadata] = useState(JSON.stringify({ 
    metadata: { protocol: 'x402', maxAmountRequired: "10000", payTo: "0x123", network: "base" }, 
    endpoints: { primary: "https://nut402.codenut.xyz/api/mint" } 
  }, null, 2));

  useEffect(() => {
    const handleLog = (log: string) => {
      setLogs(prevLogs => [...prevLogs, log]);
    };

    hypercoreService.on('log', handleLog);

    return () => {
      hypercoreService.off('log', handleLog);
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
  };

  return (
    <div>
      <h2>Hypercore Logs</h2>
      <div>
        <input 
          type="text" 
          value={coordinate} 
          onChange={e => setCoordinate(e.target.value)} 
          placeholder="Coordinate" 
        />
        <button onClick={startAgent}>Start Agent</button>
      </div>
      <div>
        <input 
          type="text" 
          value={privateKey} 
          onChange={e => setPrivateKey(e.target.value)} 
          placeholder="Private Key" 
        />
        <textarea 
          value={targetMetadata} 
          onChange={e => setTargetMetadata(e.target.value)} 
          placeholder="Target Metadata" 
        />
        <button onClick={startManager}>Start Manager</button>
      </div>
      <pre>
        {logs.join('\n')}
      </pre>
    </div>
  );
};

export default HypercoreLogger;
