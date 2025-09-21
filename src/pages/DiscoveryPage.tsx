import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LiqeSearchComponent from '../components/LiqeSearchComponent';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import discoveryStyles from '../styles/DiscoveryPage.module.css';
import { searchService } from '../services/SearchService';
import { discoveryEngineService } from '../services/DiscoveryEngineService';
import { graphSearchService } from '../services/GraphSearchService';
import { Product } from '../lib/types';
import { discoverySearchStore } from '../stores/DiscoverySearchStore';

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    discoveryEngineService.initialize();
    discoverySearchStore.initialize().then(() => {
      const cachedProducts = discoverySearchStore.getAllProducts() as unknown as Product[];
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
      }
    });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const performSearch = async (searchTerm: string) => {
    setSearchTerm(searchTerm);
    const cachedProducts = discoverySearchStore.getSearchResults(searchTerm) as unknown as Product[];
    if (cachedProducts.length > 0) {
      setProducts(cachedProducts);
      return;
    }

    // For now, we'll use a placeholder for the user vector.
    // This will be replaced with the actual user profile vector later.
    const placeholderUserVector = { '1': 1 };
    const placeholderUserContext = {};

    const topProducts = await searchService.performSemanticSearch(searchTerm);
    setProducts(topProducts);
    await discoverySearchStore.addSearchResults(searchTerm, topProducts);

    const discoveryResults = await discoveryEngineService.discover(
      placeholderUserVector,
      placeholderUserContext
    );

    if (discoveryResults.discoveries.similar_products) {
      setSimilarProducts(discoveryResults.discoveries.similar_products.similarProducts);
    }
  };

  const handleProductClick = (asin: string) => {
    if (asin) {
      // --- New Graph Search Integration ---
      const userId = 'u123'; // Hardcoded for demonstration
      const searchResults = graphSearchService.findUserInteractions(userId, 'click');
      console.log(`Graph search for user "${userId}" with action "click":`, searchResults);
      // ------------------------------------
      navigate(`/similar/${asin}`);
    }
  };

  return (
    <div className={discoveryStyles.page}>
      <div className={discoveryStyles.searchHeader}>
        <button onClick={() => navigate('/')} className={discoveryStyles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <CategoryFilter onFilterChange={() => {}} />
        <LiqeSearchComponent ref={searchInputRef} onSearch={performSearch} />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <div className={discoveryStyles.productGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.asin}
              product={product}
              onClick={() => handleProductClick(product.asin)}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default DiscoveryPage;

