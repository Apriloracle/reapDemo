import React, { useState, forwardRef, useEffect } from 'react';

interface LiqeSearchComponentProps {
  onSearch?: (searchTerm: string) => void;
}

const LiqeSearchComponent = forwardRef<HTMLInputElement, LiqeSearchComponentProps>(({ onSearch }, ref) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query) {
        handleSearch();
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const handleSearch = async () => {
    const searchTerm = query.trim();
    if (onSearch && searchTerm) {
      await onSearch(searchTerm);
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
    <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
      <input
        ref={ref}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search products..."
        style={{
          padding: '0.5rem',
          borderRadius: '20px',
          border: `1px solid ${isFocused ? '#f05e23' : '#ccc'}`,
          width: '100%',
          outline: 'none', // Remove default focus outline
          boxSizing: 'border-box',
        }}
      />
    </form>
  );
});

export default LiqeSearchComponent;



