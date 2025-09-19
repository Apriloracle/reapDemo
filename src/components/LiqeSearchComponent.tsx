import React, { useState, useEffect } from 'react';
import { useSearch } from '../contexts/SearchContext';


interface LiqeSearchComponentProps {
  onFilter: (filteredData: any[]) => void;
}

const LiqeSearchComponent: React.FC<LiqeSearchComponentProps> = ({ onFilter }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchService = useSearch();

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchService) {
        const results = searchService.search(query);
        onFilter(results);

        // New: Add the search query to the user's profile
      }
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [query, searchService, onFilter]);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search products..."
        style={{
          padding: '0.5rem',
          borderRadius: '4px',
          border: `1px solid ${isFocused ? '#f05e23' : '#ccc'}`,
          width: '250px',
          outline: 'none', // Remove default focus outline
        }}
      />
    </div>
  );
};

export default LiqeSearchComponent;
