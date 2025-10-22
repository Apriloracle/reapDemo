import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LiqeSearchComponent from '../components/LiqeSearchComponent';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import discoveryStyles from '../styles/DiscoveryPage.module.css';
import { Product } from '../lib/types';
import { discoveryEngineService } from '../services/DiscoveryEngineService';
import { shoppingProductsStore } from '../stores/ShoppingProductsStore';

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const shuffleAndLimit = (array: Product[], limit: number) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  };

  useEffect(() => {
    discoveryEngineService.initialize();
    shoppingProductsStore.initialize().then(() => {
      const cachedProducts = shoppingProductsStore.getProducts() as unknown as Product[];
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
      }
    });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchResults = async (results: any[]) => {
    const formattedProducts = results.map((p: any) => ({
      ...p,
      asin: p.productId,
      imageUrl: p.imageUrl,
      name: p.title,
      source: p.source,
      rating: p.rating,
      ratingCount: p.ratingCount,
    }));
    setProducts(formattedProducts);
    await shoppingProductsStore.addProducts(formattedProducts);
  };

  const handleProductClick = (product: Product) => {
    if (product && product.asin) {
      navigate(`/products/${product.asin}`);
    }
  };

  const displayedProducts = shuffleAndLimit(products, 40);

  return (
    <div className={discoveryStyles.page}>
      <div className={discoveryStyles.searchHeader}>
        <button onClick={() => navigate('/')} className={discoveryStyles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <LiqeSearchComponent 
          ref={searchInputRef} 
          onSearchResults={handleSearchResults} 
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
