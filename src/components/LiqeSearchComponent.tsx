import React, { useState, forwardRef } from 'react';
import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

interface LiqeSearchComponentProps {
  onSearch?: (searchTerm: string) => void;
  onSearchResults?: (results: any[]) => void;
}

const LiqeSearchComponent = forwardRef<HTMLInputElement, LiqeSearchComponentProps>(({ onSearch, onSearchResults }, ref) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = async () => {
    const searchTerm = query.trim();
    if (searchTerm) {
      if (onSearch) {
        await onSearch(searchTerm);
      }
      try {
        const geolocationStore = createStore();
        const geolocationPersister = createLocalPersister(geolocationStore, 'user-geolocation');
        await geolocationPersister.load();
        const countryCode = geolocationStore.getCell('geolocation', 'userGeo', 'countryCode') as string || 'us';

        const response = await fetch('https://shoppingapicaller-50775725716.asia-southeast1.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: searchTerm, gl: countryCode }),
        });
        if (response.ok) {
          const results = await response.json();
          console.log('Search results:', results);
          if (onSearchResults) {
            onSearchResults(results.shopping || []);
          }
        } else {
          console.error('Search API call failed');
        }
      } catch (error) {
        console.error('Error during search API call:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission from reloading the page
      handleSearch();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent form submission from reloading the page
    handleSearch();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexGrow: 1 }}>
      <input
        ref={ref}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Find product deals.."
        style={{
          padding: '0.5rem',
          borderRadius: '20px 0 0 20px',
          border: `1px solid ${isFocused ? '#f05e23' : '#ccc'}`,
          width: '100%',
          outline: 'none', // Remove default focus outline
          boxSizing: 'border-box',
        }}
      />
      <button type="submit" style={{
        padding: '0.5rem 1rem',
        border: '1px solid #f05e23',
        backgroundColor: '#f05e23',
        color: 'white',
        borderRadius: '0 20px 20px 0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    </form>
  );
});

export default LiqeSearchComponent;




