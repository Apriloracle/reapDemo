import React, { useState } from 'react';
import { agentDataStore } from '../stores/AgentDataStore';

export const AgentFetcher: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('customer support');
  const [registry, setRegistry] = useState<string>('pulsemcp');

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Searching for agents with query: "${query}" in registry: "${registry}"`);
      
      const response = await fetch('/api/search-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query, 
          limit: 40,
          registry
        }),
      });

      const searchResults = await response.json();
      console.log('API Response:', searchResults);

      if (!response.ok) {
        throw new Error(searchResults.error || 'Search failed');
      }

      agentDataStore.transaction(() => {
        agentDataStore.delTable('agents');
        if (searchResults.hits.length > 0) {
          searchResults.hits.forEach((hit: any) => {
            agentDataStore.setRow('agents', hit.id, {
              uaid: hit.uaid,
              registry: hit.registry,
              name: hit.name,
              description: hit.description,
              endpoints: JSON.stringify(hit.endpoints),
              metadata: JSON.stringify(hit.metadata),
              profile: JSON.stringify(hit.profile),
              createdAt: hit.createdAt,
              updatedAt: hit.updatedAt,
            });
          });
        }
      });
    } catch (err: any) {
      console.error("Search failed", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for agents (e.g., 'customer support')"
          className="p-2 border rounded w-full"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <p>Searching for agents...</p>}
    </div>
  );
};


