import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

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
