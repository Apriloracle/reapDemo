import React from 'react';
import { useTable } from 'tinybase/ui-react'; // Changed from 'tinybase/react'
import { agentDataStore } from '../stores/AgentDataStore';
import { AgentFetcher } from '../components/AgentFetcher';

const AgentExplorerPage = () => {
  const agents = useTable('agents', agentDataStore);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Agent Explorer</h2>
      <AgentFetcher />
      <div className="grid gap-4">
        {Object.values(agents).map((agent: any) => (
          <div key={agent.id} className="border p-4 rounded shadow-sm bg-gray-50">
            <div className="font-mono text-sm text-blue-600">ID: {agent.id}</div>
            <div className="font-bold">{agent.name}</div>
            <div className="text-xs text-gray-500 truncate" title={agent.description}>
              {agent.description}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Registered: {new Date(agent.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentExplorerPage;
