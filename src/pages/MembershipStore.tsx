import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

const store = createStore().setTable('membership', {
  member: { isMember: false },
});

const persister = createLocalPersister(store, 'membership');

export const membershipStore = {
  store,
  persister,
  initialize: async () => {
    await persister.load();
  },
};
