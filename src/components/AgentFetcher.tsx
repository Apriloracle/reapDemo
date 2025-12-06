import React, { useState } from 'react';
import { agentDataStore, addHolocronCoordinatesToAgent } from '../stores/AgentDataStore';
import { Agent } from '../types/firefly';

export const AgentFetcher: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('customer support');
  const [registry, setRegistry] = useState<string>('erc-8004');

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

      if (searchResults.hits.length > 0) {
        const agents: Agent[] = searchResults.hits.map((hit: any) => ({
          fireflyId: hit.id,
          agentId: hit.uaid,
          wallet: '', // Not available in hit
          metadataUri: '', // Not available in hit
          timestamp: hit.createdAt,
          metadata: JSON.stringify(hit.metadata),
          profile: JSON.stringify(hit.profile),
        }));

        const agentsWithCoords = await Promise.all(agents.map(addHolocronCoordinatesToAgent));

        agentDataStore.transaction(() => {
          agentDataStore.delTable('agents');
          agentsWithCoords.forEach((agent, index) => {
            const hit = searchResults.hits[index];
            agentDataStore.setRow('agents', agent.fireflyId, {
              uaid: agent.agentId,
              registry: hit.registry,
              name: hit.name,
              description: hit.description,
              endpoints: JSON.stringify(hit.endpoints),
              metadata: agent.metadata || '',
              profile: agent.profile || '',
              createdAt: agent.timestamp,
              updatedAt: hit.updatedAt,
            });
          });
        });
      } else {
        agentDataStore.delTable('agents');
      }
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
      {/* Add Registry Selector */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Registry:</label>
        <select 
          value={registry} 
          onChange={(e) => setRegistry(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="pulsemcp">PulseMCP</option>
          <option value="">ERC-8004</option>
          <option value="coinbase-x402-bazaar">Coinbase x402 Bazaar</option>
          <option value="a2a-registry">A2A Regsitry</option>
        </select>
      </div>

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

