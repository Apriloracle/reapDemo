import { createStore, Store } from 'tinybase';
import { createIndexes, Indexes } from 'tinybase/indexes';
import { createQueries, Queries } from 'tinybase/queries';
import { Product } from '@/lib/types'; // Assuming a Product type exists
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { userProfileStore } from './UserProfileStore';

// 1. Create a single, global store instance.
const store = createStore();
let persister: any;

// 2. Create an Indexes and Queries object for the store.
const indexes = createIndexes(store);
const queries = createQueries(store);

// 3. Define the structure of our master tables.
export const PRODUCTS_TABLE = 'products';
export const USER_PROFILE_TABLE = 'userProfile';

// 4. Define the index definitions.
// These will be the "views" into our data.
export const INDEX_DEFINITIONS = {
  byCategory: 'categoryId',
  bySimilaritySource: 'similaritySourceId',
  bySearchTerm: 'searchTerm',
  byMerchant: 'merchantName',
  byTag: 'tags',
  isFavorite: 'isFavorite',
};

// 5. Initialize the indexes.
indexes.setIndexDefinition(
  'byCategory',
  PRODUCTS_TABLE,
  INDEX_DEFINITIONS.byCategory
);
indexes.setIndexDefinition(
  'bySimilaritySource',
  PRODUCTS_TABLE,
  INDEX_DEFINITIONS.bySimilaritySource
);
indexes.setIndexDefinition(
  'bySearchTerm',
  PRODUCTS_TABLE,
  INDEX_DEFINITIONS.bySearchTerm
);
indexes.setIndexDefinition(
  'isFavorite',
  PRODUCTS_TABLE,
  INDEX_DEFINITIONS.isFavorite
);
indexes.setIndexDefinition(
  'byMerchant',
  PRODUCTS_TABLE,
  INDEX_DEFINITIONS.byMerchant
);
indexes.setIndexDefinition(
  'byTag',
  PRODUCTS_TABLE,
  (getCell) => (getCell('tags') as string)?.split(',') ?? [],
);

/**
 * Adds or updates a batch of products in the central store.
 * This function will be called by other stores (CategoryStore, etc.)
 * to populate the index.
 *
 * @param products An array of Product objects.
 * @param context An object providing context for indexing, e.g., { categoryId: 'cat123' }
 */
export const upsertProducts = (products: Product[], context: Record<string, any>) => {
  products.forEach((product) => {
    // Serialize the vector if it exists, as Tinybase cells must be primitives.
    const vectorJson = product.vector ? JSON.stringify(product.vector) : undefined;

    // Generate tags from product data for linking with user interests.
    // This is a simple implementation; a more sophisticated NLP approach could be used later.
    const tags = [
      ...(product.name?.toLowerCase().split(' ') ?? []),
      (product as any).categoryId,
      context.merchantName,
    ].filter(Boolean); // Filter out any null/undefined values

    // Merge product data with context for indexing
    const rowData: { [key: string]: any } = {
      ...product,
      ...context,
      tags: tags.join(','), // Store tags as a comma-separated string
    };

    if (vectorJson) {
      rowData.vector = vectorJson;
    }

    store.setRow(PRODUCTS_TABLE, product.asin, rowData);
  });
  if (persister) {
    persister.save();
  }
};

/**
 * Adds or updates the user profile in the central store.
 * @param profile The user profile object.
 */
export const upsertUserProfile = (profile: any) => {
  const rowData = {
    ...profile,
    interests: JSON.stringify(profile.interests ?? []),
    shopping: JSON.stringify(profile.shopping ?? []),
  };
  store.setRow(USER_PROFILE_TABLE, 'currentUser', rowData);
  if (persister) {
    persister.save();
  }
};

/**
 * Retrieves the raw Tinybase Store instance.
 * Useful for direct interaction or advanced use cases.
 */
export const getProductStore = (): Store => store;

/**
 * Retrieves the Tinybase Indexes instance.
 * This is the primary way UI components will query and listen to data.
 */
export const getProductIndexes = (): Indexes => indexes;

/**
 * Initializes the ProductIndexStore by loading persisted data.
 */
export const initializeProductIndexStore = async () => {
  if (typeof window !== 'undefined') {
    if (!persister) {
      persister = createLocalPersister(store, 'product-index');
    }
    await persister.load();
    console.log('ProductIndexStore initialized from persister.');
  }
};

/**
 * Retrieves the Tinybase Queries instance.
 * This will be used for complex, cross-table queries.
 */
export const getProductQueries = (): Queries => queries;

// Define the personalized products query
queries.setQueryDefinition(
  'getPersonalizedProducts',
  PRODUCTS_TABLE,
  ({ select, join, where }) => {
    // Select all columns from the products table
    select('*');

    // Join with the user profile table
    join(USER_PROFILE_TABLE, 'currentUser').as('userProfile');

    // Filter products where the product's tags intersect with the user's interests
    where((getTableCell) => {
      const productTags = (getTableCell('tags') as string)?.toLowerCase().split(',') ?? [];
      const userProfileRow = store.getRow(USER_PROFILE_TABLE, 'currentUser');
      const userInterests = userProfileRow.interests ? JSON.parse(userProfileRow.interests as string).map((i: string) => i.toLowerCase()) : [];

      if (userInterests.length === 0) {
        return true;
      }
      return userInterests.some((interest: string) => productTags.includes(interest.toLowerCase()));
    });
  }
);

