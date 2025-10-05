import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

export interface FavoriteItem {
  asin: string;
  title: string;
  price: number;
  imageUrl: string;
  addedAt: string;
}

const store = createStore().setTable('favorites', {});
let persister: any;

if (typeof window !== 'undefined') {
  persister = createLocalPersister(store, 'favorites');
  persister.load();
}

export const favoriteStore = {
  addFavorite: (item: FavoriteItem) => {
    store.setRow('favorites', item.asin, item as any);
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
  getFavorites: (): FavoriteItem[] => {
    const favorites = store.getTable('favorites');
    return Object.values(favorites).map((fav) => fav as unknown as FavoriteItem);
  },
  getFavorite: (asin: string): FavoriteItem | undefined => {
    return store.getRow('favorites', asin) as unknown as FavoriteItem | undefined;
  },
  useFavorites: () => {
    // This is a placeholder for a reactive hook.
    // Depending on the framework, you might use a listener or a specific hook.
    return favoriteStore.getFavorites();
  }
};
