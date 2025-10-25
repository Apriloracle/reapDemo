import { createStore, createIndexes } from 'tinybase';

/**
 * SearchIndexStore
 * 
 * This store is responsible for indexing all search results to enable
 * advanced sorting and filtering capabilities. It is built using TinyBase.
 */
const store = createStore();

// Define the schema for the 'searchResults' table as specified in spec 1.93
store.setTablesSchema({
  searchResults: {
    id: { type: 'string' },
    query: { type: 'string' },
    name: { type: 'string' },
    source: { type: 'string' },
    price: { type: 'number' },
    rating: { type: 'number' },
    ratingCount: { type: 'number' },
    position: { type: 'number' },
    timestamp: { type: 'number' },
    resultData: { type: 'string' },
  },
});

// Create an Indexes object
const indexes = createIndexes(store);

// Define indexes for efficient data retrieval
indexes.setIndexDefinition('byQuery', 'searchResults', 'query');
indexes.setIndexDefinition('byTimestamp', 'searchResults', 'timestamp');
indexes.setIndexDefinition('byPrice', 'searchResults', 'price');
indexes.setIndexDefinition('byRating', 'searchResults', 'rating');
indexes.setIndexDefinition('byPosition', 'searchResults', 'position');


export const getResultsSortedByPrice = (ascending = true) => {
  const sortedRowIds = indexes.getSliceRowIds('byPrice', 'byPrice');
  return (ascending ? sortedRowIds : sortedRowIds.reverse()).map((rowId) =>
    store.getRow('searchResults', rowId)
  );
};

export const getResultsSortedByRating = (ascending = true) => {
  const sortedRowIds = indexes.getSliceRowIds('byRating', 'byRating');
  return (ascending ? sortedRowIds : sortedRowIds.reverse()).map((rowId) =>
    store.getRow('searchResults', rowId)
  );
};

export const getResultsSortedByPosition = () => {
  const sortedRowIds = indexes.getSliceRowIds('byPosition', 'byPosition');
  return sortedRowIds.map((rowId) => store.getRow('searchResults', rowId));
};

export const searchIndexStore = store;
export const searchIndexIndexes = indexes;
