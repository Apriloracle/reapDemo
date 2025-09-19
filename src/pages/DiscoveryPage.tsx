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

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);

  useEffect(() => {
    discoveryEngineService.initialize();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const performSearch = async (searchTerm: string) => {
    // For now, we'll use a placeholder for the user vector.
    // This will be replaced with the actual user profile vector later.
    const placeholderUserVector = { '1': 1 }; 
    const placeholderUserContext = {};

    const topProducts = await searchService.performSemanticSearch(searchTerm);
    setProducts(topProducts);

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
        <LiqeSearchComponent ref={searchInputRef} onSearch={performSearch} />
        <CategoryFilter onFilterChange={() => {}} />
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

        {similarProducts.length > 0 && (
          <div>
            <h2 className={discoveryStyles.sectionHeader}>Similar Products</h2>
            <div className={discoveryStyles.productGrid}>
              {similarProducts.map((product, index) => (
                <ProductCard
                  key={product.metadata?.asin || index}
                  product={{
                    asin: product.metadata?.asin || `similar-${index}`,
                    name: product.metadata?.title || `Similar Product ${index + 1}`,
                    imageUrl: '',
                    price: product.metadata?.price || 0,
                    score: product.similarity,
                  }}
                  onClick={() => handleProductClick(product.metadata?.asin)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoveryPage;
