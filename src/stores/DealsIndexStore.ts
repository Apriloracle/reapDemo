import { createStore, Store } from 'tinybase';
import { createIndexes, Indexes } from 'tinybase/indexes';
import { createRelationships, Relationships } from 'tinybase/relationships';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { getDealsStore as getKindredDealsStore } from './KindredDealsStore';

const store = createStore();
const indexes = createIndexes(store);
const relationships = createRelationships(store);
const persister = typeof window !== 'undefined'
  ? createLocalPersister(store, 'deals-index')
  : null;

store.setTablesSchema({
  deals: {
    dealId: { type: 'string' },
    merchantName: { type: 'string' },
    codes: { type: 'string' },
  },
  searchResults: {
    asin: { type: 'string' },
    name: { type: 'string' },
    source: { type: 'string' },
    price: { type: 'number' },
    rating: { type: 'number' },
    ratingCount: { type: 'number' },
    deal: { type: 'string', default: '' },
  },
});

indexes.setIndexDefinition(
  'byMerchant',
  'deals',
  'merchantName'
);

indexes.setIndexDefinition(
  'byBrand',
  'searchResults',
  'brand' // We will add this field to the search results
);

relationships.setRelationshipDefinition(
  'productDeal',
  'searchResults',
  'deals',
  'brand'
);

export const getDealsIndexStore = (): Store => store;
export const getDealsIndexes = (): Indexes => indexes;
export const getDealsRelationships = (): Relationships => relationships;

export const initializeDealsIndexStore = async () => {
  if (persister) {
    await persister.load();
  }
  const dealsStore = getKindredDealsStore();
  const deals = dealsStore.getTable('deals');
  store.setTable('deals', deals);
  console.log('DealsIndexStore initialized. First 5 deals:', Object.values(deals).slice(0, 5));
  if (persister) {
    await persister.save();
  }
};
