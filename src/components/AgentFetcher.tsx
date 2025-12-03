import React, { useEffect, useState } from 'react';
import { Agent, FireflyBlockchainEvent } from '../types/firefly';
import { agentStore } from '../stores/AgentStore';

const FIREFLY_API_URL = "/api/firefly";
const METADATA_PROXY_URL = "/api/metadata";

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}. Retrying in ${delay}ms...`, error);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
}

export const AgentFetcher: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const fetchAllAgents = async () => {
      const allRecords: Agent[] = [];
      let skip = 0;
      
      try {
        setLoading(true);
        const limit = 50;
        let hasMore = true;

        while (hasMore) {
          const params = new URLSearchParams({
            limit: limit.toString(),
            skip: skip.toString(),
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
          const cleanedBatch = data.map((event) => ({
            fireflyId: event.id,
            agentId: event.blockchainEvent.output.agentId || '0',
            wallet: event.blockchainEvent.output.owner || 'Unknown',
            metadataUri: event.blockchainEvent.output.tokenURI || '',
            timestamp: event.blockchainEvent.info.timestamp,
          }));
          allRecords.push(...cleanedBatch);
          setProgress(allRecords.length);
          skip += data.length;
          if (data.length < limit) {
            hasMore = false;
          }
        }
        console.log(`✅ Finished. Total Agents: ${allRecords.length}`);
      } catch (err: any) {
        console.error("Fetch failed", err);
        setError(err.message);
      } finally {
        setAgents(allRecords);
        await agentStore.setAgents(allRecords);
        setLoading(false);
      }
    };

    fetchAllAgents();
  }, []);

  useEffect(() => {
    const fetchAgentMetadata = async () => {
      const agentsToUpdate = agents.filter(agent => agent.metadataUri && !agent.metadata);
      for (const agent of agentsToUpdate) {
        try {
          let metadata;
          if (agent.metadataUri.startsWith('data:application/json;base64,')) {
            try {
              const base64String = agent.metadataUri.split(',')[1];
              metadata = JSON.parse(atob(base64String));
            } catch (error) {
              console.error(`Failed to decode base64 metadata for agent ${agent.agentId}:`, error);
              continue;
            }
          } else if (agent.metadataUri.startsWith('http')) {
            const proxyUrl = `${METADATA_PROXY_URL}?url=${encodeURIComponent(agent.metadataUri)}`;
            metadata = await fetchWithRetry(proxyUrl);
          }
          if (metadata) {
            agentStore.addAgent({ ...agent, metadata: JSON.stringify(metadata) });
          }
        } catch (error) {
          console.error(`Failed to fetch metadata for agent ${agent.agentId}:`, error);
        }
      }
    };

    if (agents.length > 0) {
      fetchAgentMetadata();
    }
  }, [agents]);

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
