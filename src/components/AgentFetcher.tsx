import React, { useEffect, useState } from 'react';
import { Agent, FireflyBlockchainEvent } from '../types/firefly';

// Use our local proxy to avoid mixed content issues
const FIREFLY_API_URL = "/api/firefly";
const LISTENER_ID = "3e002303-9289-4ef7-8701-f0f7cea11435"; // From your snippet

export const AgentFetcher: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const fetchAllAgents = async () => {
      try {
        setLoading(true);
        const allRecords: Agent[] = [];
        let skip = 0;
        const limit = 50;
        let hasMore = true;

        while (hasMore) {
          // 1. Build URL
          const params = new URLSearchParams({
            listener: LISTENER_ID,
            limit: limit.toString(),
            skip: skip.toString(),
            sort: 'timestamp', // Ensure consistent ordering
          });

          const response = await fetch(`${FIREFLY_API_URL}?${params}`);

          if (!response.ok) {
            throw new Error(`Firefly Error: ${response.statusText}`);
          }

          const data: FireflyBlockchainEvent[] = await response.json();

          if (data.length === 0) {
            hasMore = false;
            break;
          }

          // 2. Map and Clean Data
          const cleanedBatch = data.map((event) => {
            const output = event.output;
            return {
              fireflyId: event.id,
              agentId: output.agentId || '0',
              // Handle various field names for wallet
              wallet: output.owner || output.agentWallet || output.to || 'Unknown',
              // Handle various field names for metadata
              metadataUri: output.tokenURI || output.metadata || '',
              timestamp: event.info.timestamp,
            };
          });

          allRecords.push(...cleanedBatch);
          
          // Update progress for UI
          setProgress(allRecords.length);
          
          // Prepare next page
          skip += limit;
        }

        console.log(`✅ Finished. Total Agents: ${allRecords.length}`);
        setAgents(allRecords);
      } catch (err: any) {
        console.error("Fetch failed", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAgents();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <p>📡 Syncing Agents from Firefly...</p>
        <p>Fetched: {progress} agents...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Registry: {agents.length} Agents</h2>
      
      <div className="grid gap-4">
        {agents.map((agent) => (
          <div key={agent.fireflyId} className="border p-4 rounded shadow-sm bg-gray-50">
            <div className="font-mono text-sm text-blue-600">ID: {agent.agentId}</div>
            <div className="font-bold">{agent.wallet}</div>
            <div className="text-xs text-gray-500 truncate" title={agent.metadataUri}>
              URI: {agent.metadataUri}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Registered: {new Date(agent.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
