// AgentFetcher.tsx
import React, { useState, useEffect } from 'react';
import { agentDataStore } from '../stores/AgentDataStore';

interface AgentFetcherProps {
  query?: string;
}

const AgentFetcher: React.FC<AgentFetcherProps> = ({ query = '' }) => {
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    // Automatically perform search when query prop changes
    if (query) {
      handleSearch(query);
    }
  }, [query]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/agents?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      // Clear existing agents and add new ones
      agentDataStore.delTable('agents');
      data.forEach((agent: any) => {
        agentDataStore.setRow('agents', agent.id, agent);
      });
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agents..."
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default AgentFetcher;



