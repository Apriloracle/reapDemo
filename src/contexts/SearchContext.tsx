import React, { createContext, useContext } from 'react';
import { searchService } from '../services/SearchService';
import type { Store } from 'tinybase';

// The context will now provide the singleton instance.
const SearchContext = createContext<typeof searchService | null>(null);

export const useSearch = () => {
  return useContext(SearchContext);
};

interface SearchProviderProps {
  store: Store;
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  // The provider now simply provides the imported singleton instance.
  // The 'store' prop is no longer needed for this context.
  return (
    <SearchContext.Provider value={searchService}>
      {children}
    </SearchContext.Provider>
  );
};
