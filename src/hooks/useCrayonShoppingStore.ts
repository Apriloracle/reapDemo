import { useCell, useTable } from 'tinybase/ui-react';
import { favoriteStore } from '../stores/FavoriteStore';
import { searchIndexStore } from '../stores/SearchIndexStore';
import { userProfileStore } from '../stores/UserProfileStore';

export const useCrayonShoppingStore = () => {
  const cart = useTable('cart', favoriteStore.getStore());
  const wishlist = useTable('wishlist', favoriteStore.getStore());
  const searchHistory = useTable('searches', searchIndexStore);
  const walletAddress = useCell('profiles', 'current', 'walletAddress', userProfileStore.getStore());

  const addToCart = (item: any) => {
    favoriteStore.addFavorite({ ...item, isWishlistItem: false });
  };

  const addToWishlist = (item: any) => {
    favoriteStore.addFavorite({ ...item, isWishlistItem: true });
  };

  const addSearchHistory = (query: string) => {
    const id = new Date().toISOString();
    searchIndexStore.setRow('searches', id, { query, timestamp: id });
  };

  const connectWallet = (address: string) => {
    userProfileStore.updateProfile({ walletAddress: address });
  };

  return {
    cart,
    wishlist,
    searchHistory,
    walletAddress,
    addToCart,
    addToWishlist,
    addSearchHistory,
    connectWallet,
  };
};
