import { useState } from 'react';
import { decode } from '@toon-format/toon';

const ToonDebugPage = () => {
  const [query, setQuery] = useState('organic supplements');
  const [rawData, setRawData] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setRawData(null);
    setDecodedData(null);
    setError(null);
    console.clear();

    try {
      console.log('Fetching from /tester2...');
      const toonRes = await fetch('/tester2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!toonRes.ok) {
        throw new Error(`Network response was not ok: ${toonRes.statusText}`);
      }

      const toonText = await toonRes.text();
      console.log('Received text response:', toonText);
      setRawData(toonText as any); // Storing the raw text for debugging

      console.log('Attempting to decode from text...');
      try {
        const decoded = decode(toonText);
        console.log('Decoding successful:', decoded);
        setDecodedData(decoded);
      } catch (e: any) {
        console.error('DECODING FAILED:', e);
        setError(`Decoding failed: ${e.message}`);
      }

    } catch (err: any) {
      console.error('FETCH FAILED:', err);
      setError(`Fetch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>TOON Debug Page</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}><strong>Error:</strong> {error}</div>}

      <div>
        <h2>Raw TOON Response (Text)</h2>
        <pre style={{ background: '#f4f4f4', padding: '10px', height: '150px', overflow: 'auto', wordBreak: 'break-all' }}>
          {rawData || 'null'}
        </pre>
      </div>

      <div>
        <h2>Decoded TOON Response</h2>
        <pre style={{ background: '#f4f4f4', padding: '10px', height: '300px', overflow: 'auto' }}>
          {JSON.stringify(decodedData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ToonDebugPage;

