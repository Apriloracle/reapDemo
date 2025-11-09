import { userProfileStore } from './UserProfileStore';
import { dealsIndexStore } from './DealsIndexStore';
import { categoryStore } from './CategoryStore';
import { coordinateIndexStore } from './CoordinateIndexStore';
import { deviceDataStore } from './DeviceDataStore';
import { discoverySearchStore } from './DiscoverySearchStore';
import { favoriteStore } from './FavoriteStore';
import { hypervectorProfileStore } from './HypervectorProfileStore';
import { kindredDealsStore } from './KindredDealsStore';
import { membershipStore } from './MembershipStore';
import { merchantProductsStore } from './MerchantProductsStore';
import { searchIndexStore } from './SearchIndexStore';
import { shoppingProductsStore } from './ShoppingProductsStore';
import { similarProductsStore } from './SimilarProductsStore';
import { trajectoryStore } from './TrajectoryStore';

const stores = {
  userProfileStore,
  dealsIndexStore,
  categoryStore,
  coordinateIndexStore,
  deviceDataStore,
  discoverySearchStore,
  favoriteStore,
  hypervectorProfileStore,
  kindredDealsStore,
  membershipStore,
  merchantProductsStore,
  searchIndexStore,
  shoppingProductsStore,
  similarProductsStore,
  trajectoryStore,
};

export function getStore(storeName: keyof typeof stores) {
  return stores[storeName];
}

export {
  userProfileStore,
  dealsIndexStore,
  categoryStore,
  coordinateIndexStore,
  deviceDataStore,
  discoverySearchStore,
  favoriteStore,
  hypervectorProfileStore,
  kindredDealsStore,
  membershipStore,
  merchantProductsStore,
  searchIndexStore,
  shoppingProductsStore,
  similarProductsStore,
  trajectoryStore,
};
