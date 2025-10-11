import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

import { addCoordinateToStore } from '../lib/storeCoordinates';

const store = createStore().setTable('favorites', {});
let persister: any;

if (typeof window !== 'undefined') {
  persister = createLocalPersister(store, 'favorites');
  persister.load();
}

interface FavoriteStore {
  initialize: () => Promise<void>;
  getStore: () => typeof store;
  addFavorite: (item: any) => Promise<void>;
  removeFavorite: (asin: string) => void;
  getFavorites: () => any[];
  getFavorite: (asin: string) => any | undefined;
  useFavorites: () => any[];
}

export const favoriteStore: FavoriteStore = {
  initialize: async () => {
    if (persister) {
      await persister.load();
    }
  },
  getStore: () => store,
  addFavorite: async (item: any) => {
    store.setRow('favorites', item.asin, item);

    // Add coordinate functionality and update the coordinate for the new favorite.
    const updateCoordinates = addCoordinateToStore(store, 'favorites');
    await updateCoordinates();

    if (persister) {
      persister.save();
    }
  },
  removeFavorite: (asin: string) => {
    store.delRow('favorites', asin);
    if (persister) {
      persister.save();
    }
  },
  getFavorites: (): any[] => {
    const favorites = store.getTable('favorites');
    return Object.values(favorites);
  },
  getFavorite: (asin: string): any | undefined => {
    return store.getRow('favorites', asin);
  },
  useFavorites: () => {
    // This is a placeholder for a reactive hook.
    // Depending on the framework, you might use a listener or a specific hook.
    return favoriteStore.getFavorites();
  }
};
