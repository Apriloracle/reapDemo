import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LiqeSearchComponent from '../components/LiqeSearchComponent';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import discoveryStyles from '../styles/DiscoveryPage.module.css';
import { searchService } from '../services/SearchService';
import { discoveryEngineService } from '../services/DiscoveryEngineService';
import { graphSearchService } from '../services/GraphSearchService';
import trajectoryService from '../services/TrajectoryService';
import { Product } from '../lib/types';
import { discoverySearchStore } from '../stores/DiscoverySearchStore';
import { categoryStore } from '../stores/CategoryStore';


interface ProductWithCategory extends Product {
  categoryId?: string;
}

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [keywordProducts, setKeywordProducts] = useState<Product[]>([]);
  const [serverProducts, setServerProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const shuffleAndLimit = (array: Product[], limit: number) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  };

  useEffect(() => {
    trajectoryService.initialize();
    discoveryEngineService.initialize();
    discoverySearchStore.initialize().then(() => {
      const cachedProducts = discoverySearchStore.getAllProducts() as unknown as Product[];
      if (cachedProducts.length > 0) {
        setProducts(shuffleAndLimit(cachedProducts, 20));
      }
    });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  
  const performSearch = async (searchTerm: string) => {
    setSearchTerm(searchTerm);

    // Perform all three searches in parallel
    const [semanticResults, keywordResults, serverResults] = await Promise.all([
      searchService.performSemanticSearch(searchTerm),
      searchService.performKeywordSearch(searchTerm),
      searchService.performServerKeywordSearch(searchTerm)
    ]);

    // Update state with results
    setProducts(semanticResults);
    setKeywordProducts(keywordResults);
    setServerProducts(serverResults);

    // Cache all search results
    const allResults = [...semanticResults, ...keywordResults, ...serverResults];
    const uniqueResults = Array.from(new Map(allResults.map(p => [p.asin, p])).values());
    await discoverySearchStore.addSearchResults(searchTerm, uniqueResults);

    // Also cache in categoryStore
  const productsByCategory: { [key: string]: ProductWithCategory[] } = {};

  for (const product of uniqueResults as ProductWithCategory[]) {
    const categoryId = product.categoryId || 'unknown';

    if (!productsByCategory[categoryId]) {
      productsByCategory[categoryId] = [];
    }
    productsByCategory[categoryId].push(product);
  }

  await categoryStore.addProductsByCategory(productsByCategory);
};

  const handleProductClick = (product: Product) => {
    if (product && product.asin) {
      trajectoryService.generateTrajectory(product);
      navigate(`/similar/${product.asin}`);
    }
  };

  const uniqueProducts = Array.from(new Map([...products, ...keywordProducts, ...serverProducts].map(p => [p.asin, p])).values());
  const displayedProducts = shuffleAndLimit(uniqueProducts, 20);

  return (
    <div className={discoveryStyles.page}>
      <div className={discoveryStyles.searchHeader}>
        <button onClick={() => navigate('/')} className={discoveryStyles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <CategoryFilter onFilterChange={() => {}} />
        <LiqeSearchComponent 
          ref={searchInputRef} 
          onSearch={performSearch} 
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <div className={discoveryStyles.productGrid}>
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.asin}
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default DiscoveryPage;

