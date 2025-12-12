import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { Agent } from '../types/firefly';
import { getCoordinateForData } from '../lib/probeUtils';

export const agentDataStore = createStore().setSchema({
  agents: {
    uaid: { type: 'string' },
    registry: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    endpoints: { type: 'string' },
    metadata: { type: 'string' },
    profile: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
});

// Only create persister on client side
if (typeof window !== 'undefined') {
  const persister = createLocalPersister(agentDataStore, 'agentData');
  persister.startAutoLoad();
  persister.startAutoSave();
}

export async function addHolocronCoordinatesToAgent(agent: Agent): Promise<Agent> {
  const newAgent = { ...agent };
  if (!newAgent.metadata) {
    return newAgent;
  }

  const metadata = JSON.parse(newAgent.metadata);
  const profile = newAgent.profile ? JSON.parse(newAgent.profile) : null;
  let capabilities: any[] = [];

  if (metadata.protocol === 'mcp' && profile && profile.mcpServer && profile.mcpServer.capabilities) {
    capabilities = profile.mcpServer.capabilities.map((c: string) => ({ name: c, description: c }));
  } else if (metadata.protocol === 'x402' && profile && profile.aiAgent && profile.aiAgent.capabilities) {
    capabilities = profile.aiAgent.capabilities.map((c: number) => ({ name: c.toString(), description: c.toString() }));
  } else if (metadata.protocol === 'a2a' && profile && profile.aiAgent && profile.aiAgent.capabilities) {
    capabilities = profile.aiAgent.capabilities.map((c: number) => ({ name: c.toString(), description: c.toString() }));
  } else if (metadata.capabilities) {
    capabilities = metadata.capabilities;
  }

  for (const capability of capabilities) {
    capability.coordinate = await getCoordinateForData({
      name: capability.name,
      description: capability.description,
    });
  }

  metadata.capabilities = capabilities;
  newAgent.metadata = JSON.stringify(metadata);

  return newAgent;
}

export function getAgents() {
  const agents = agentDataStore.getTable('agents');
  return agents ? Object.values(agents) : [];
}

