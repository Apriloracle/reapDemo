import { useState } from 'react';
import { decode } from '@toon-format/toon';

const ToonTestPage = () => {
  const [query, setQuery] = useState('organic supplements');
  const [jsonResponse, setJsonResponse] = useState<any>(null);
  const [toonResponse, setToonResponse] = useState<any>(null);
  const [decodedToon, setDecodedToon] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setJsonResponse(null);
    setToonResponse(null);
    setDecodedToon(null);

    try {
      // Fetch from the original JSON endpoint
      const jsonRes = await fetch('/tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const jsonData = await jsonRes.json();
      setJsonResponse(jsonData);

      // Fetch from the new TOON endpoint
      const toonRes = await fetch('/tester2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const toonData = await toonRes.arrayBuffer();
      setToonResponse(new Uint8Array(toonData));
      
      // Decode the TOON data
      const decodedData = decode(new Uint8Array(toonData) as any);
      setDecodedToon(decodedData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>TOON vs. JSON Endpoint Test</h1>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h2>JSON Response (/api/tester)</h2>
          <pre style={{ background: '#f4f4f4', padding: '10px', height: '300px', overflow: 'auto' }}>
            {JSON.stringify(jsonResponse, null, 2)}
          </pre>
        </div>
        <div>
          <h2>Decoded TOON Response (/api/tester2)</h2>
          <pre style={{ background: '#f4f4f4', padding: '10px', height: '300px', overflow: 'auto' }}>
            {JSON.stringify(decodedToon, null, 2)}
          </pre>
        </div>
      </div>
       <div>
          <h2>Raw TOON Response (ArrayBuffer)</h2>
          <pre style={{ background: '#f4f4f4', padding: '10px', height: '150px', overflow: 'auto' }}>
            {toonResponse ? `Uint8Array(${toonResponse.length}) [${toonResponse.slice(0, 100).toString()}...]` : 'null'}
          </pre>
        </div>
    </div>
  );
};

export default ToonTestPage;
