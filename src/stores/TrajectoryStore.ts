import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

const store = createStore().setSchema({
  trajectory: {
    timestamp: { type: 'number', default: 0 },
    x: { type: 'number', default: 0 },
    y: { type: 'number', default: 0 },
    scale: { type: 'number', default: 0 },
    query: { type: 'string', default: '' },
    rawOutput: { type: 'number', default: 0 },
  },
});

export const persister = createLocalPersister(store, 'trajectory');

persister.startAutoLoad();
persister.startAutoSave();

export default store;

