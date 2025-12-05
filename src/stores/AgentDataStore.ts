import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/local';

const store = createStore().setSchema({
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
