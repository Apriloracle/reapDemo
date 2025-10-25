import { createStore, createIndexes } from 'tinybase';

/**
 * SearchIndexStore
 * 
 * This store is responsible for indexing all search results to enable
 * advanced sorting and filtering capabilities. It is built using TinyBase.
 */
const store = createStore();

// Define the schema for the 'searchResults' table as specified in spec 1.92
store.setTablesSchema({
  searchResults: {
    id: { type: 'string' },
    query: { type: 'string' },
    resultData: { type: 'string' }, // Storing object as a stringified JSON
    timestamp: { type: 'number' },
    relevance: { type: 'number' },
  },
});

// Create an Indexes object
const indexes = createIndexes(store);

// Define indexes for efficient data retrieval
indexes.setIndexDefinition('byQuery', 'searchResults', 'query');
indexes.setIndexDefinition('byTimestamp', 'searchResults', 'timestamp');
indexes.setIndexDefinition('byRelevance', 'searchResults', 'relevance');

export const searchIndexStore = store;
export const searchIndexIndexes = indexes;
