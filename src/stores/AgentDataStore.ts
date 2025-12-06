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
  const capabilities = newAgent.metadata ? JSON.parse(newAgent.metadata).capabilities || [] : [];
  for (const capability of capabilities) {
    capability.coordinate = await getCoordinateForData({
      name: capability.name,
      description: capability.description,
    });
  }
  if (newAgent.metadata) {
    const metadata = JSON.parse(newAgent.metadata);
    metadata.capabilities = capabilities;
    newAgent.metadata = JSON.stringify(metadata);
  }
  return newAgent;
}
