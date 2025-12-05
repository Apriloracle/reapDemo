import React, { useState } from 'react';
import { Agent } from '../types/firefly';
import { agentStore } from '../stores/AgentStore';

export const AgentFetcher: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('customer support');

  const [registry, setRegistry] = useState<string>('pulsemcp');

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setAgents([]);

    try {
      console.log(`Searching for agents with query: "${query}" in registry: "${registry}"`);
      
      const response = await fetch('/api/search-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query, 
          limit: 10,
          registry // Add registry to the request
        }),
      });

      const searchResults = await response.json();
      console.log('API Response:', searchResults);

      if (!response.ok) {
        throw new Error(searchResults.error || 'Search failed');
      }

      if (searchResults.hits.length === 0) {
        console.log('No agents found.');
        setAgents([]);
      } else {
        const formattedAgents: Agent[] = searchResults.hits.map((hit: any) => ({
          fireflyId: hit.uaid,
          agentId: hit.id, // Use 'id' instead of 'uaid' for agentId
          wallet: hit.profile?.display_name || hit.name || 'Unknown', // Use display name or name
          metadataUri: hit.endpoints?.primary || hit.endpoints?.repository || '',
          timestamp: new Date(hit.createdAt || Date.now()).toISOString(),
          metadata: JSON.stringify(hit),
          agentType: hit.adapter || hit.protocol || 'unknown',
        }));
        setAgents(formattedAgents);
        await agentStore.setAgents(formattedAgents);
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
      <h2 className="text-xl font-bold mb-4">Agent Explorer</h2>
      
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

      <div className="grid gap-4">
        {agents.map((agent) => (
          <div key={agent.fireflyId} className="border p-4 rounded shadow-sm bg-gray-50">
            <div className="font-mono text-sm text-blue-600">ID: {agent.agentId}</div>
            <div className="font-bold">{agent.wallet}</div>
            <div className="text-xs text-gray-500 truncate" title={agent.metadataUri}>
              URI: {agent.metadataUri}
            </div>
            {agent.metadata && (
              <div className="text-xs text-gray-600 mt-2">
                <pre>{JSON.stringify(JSON.parse(agent.metadata), null, 2)}</pre>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Registered: {new Date(agent.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

