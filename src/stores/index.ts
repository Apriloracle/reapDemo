import { userProfileStore } from './UserProfileStore';
import { getDealsIndexStore } from './DealsIndexStore';
import { categoryStore } from './CategoryStore';
import { getCoordinateStore } from './CoordinateIndexStore';
import { deviceDataStore } from './DeviceDataStore';
import { discoverySearchStore } from './DiscoverySearchStore';
import { favoriteStore } from './FavoriteStore';
import { hypervectorProfileStore } from './HypervectorProfileStore';
import { getDealsStore as getKindredDealsStore } from './KindredDealsStore';
import { membershipStore } from './MembershipStore';
import { merchantProductsStore } from './MerchantProductsStore';
import { searchIndexStore } from './SearchIndexStore';
import { shoppingProductsStore } from './ShoppingProductsStore';
import { similarProductsStore } from './SimilarProductsStore';
import trajectoryStore from './TrajectoryStore';
import { agentStore } from './AgentStore';
import { dynamicToolStore } from './DynamicToolStore';

const stores = {
  agentStore,
  dynamicToolStore,
  userProfileStore,
  dealsIndexStore: getDealsIndexStore(),
  categoryStore,
  coordinateIndexStore: getCoordinateStore(),
  deviceDataStore,
  discoverySearchStore,
  favoriteStore,
  hypervectorProfileStore,
  kindredDealsStore: getKindredDealsStore(),
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
  categoryStore,
  deviceDataStore,
  discoverySearchStore,
  favoriteStore,
  hypervectorProfileStore,
  membershipStore,
  merchantProductsStore,
  searchIndexStore,
  shoppingProductsStore,
  similarProductsStore,
  trajectoryStore,
};
