import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LiqeSearchComponent from '../components/LiqeSearchComponent';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import discoveryStyles from '../styles/DiscoveryPage.module.css';
import { Product } from '../lib/types';
import { discoveryEngineService } from '../services/DiscoveryEngineService';
import { shoppingProductsStore } from '../stores/ShoppingProductsStore';
import {
  getResultsSortedByPrice,
  getResultsSortedByRating,
  getResultsSortedByPosition,
} from '../stores/SearchIndexStore';

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortOrder, setSortOrder] = useState('position');

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
    const formattedProducts = results.map((p: any) => {
      const priceString = p.price || '';
      const price = parseFloat(priceString.replace(/[^0-9.-]+/g,""));
      
      return {
        ...p,
        asin: p.productId,
        imageUrl: p.imageUrl,
        name: p.title,
        source: p.source,
        price: price,
        priceDisplay: priceString,
        rating: p.rating,
        ratingCount: p.ratingCount,
        position: p.position,
      }
    });
    
    setProducts(formattedProducts);
    applySort(sortOrder, formattedProducts);

    await shoppingProductsStore.addProducts(formattedProducts);
  };
  
  const applySort = (sortOrder: string, productsToSort: Product[]) => {
    let sortedProducts: Product[] = [];
    if (sortOrder === 'price-asc') {
      sortedProducts = [...productsToSort].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === 'price-desc') {
      sortedProducts = [...productsToSort].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOrder === 'rating') {
      sortedProducts = [...productsToSort].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOrder === 'source') {
      sortedProducts = [...productsToSort].sort((a, b) => (a.source || '').localeCompare(b.source || ''));
    } else {
      sortedProducts = [...productsToSort].sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    setProducts(sortedProducts);
  }

  const handleProductClick = (product: Product) => {
    if (product && product.asin) {
      navigate(`/products/${product.asin}`);
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOrder = e.target.value;
    setSortOrder(newSortOrder);
    applySort(newSortOrder, products);
  };

  const displayedProducts = products.slice(0, 40);

  return (
    <div className={discoveryStyles.page}>
      <div className={discoveryStyles.searchHeader}>
        <button onClick={() => navigate('/')} className={discoveryStyles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <LiqeSearchComponent 
          ref={searchInputRef} 
          onSearchResults={handleSearchResults} 
        />
      </div>

      <div className={discoveryStyles.sortContainer}>
        <select value={sortOrder} onChange={handleSortChange} className={discoveryStyles.sortDropdown}>
          <option value="position">Sort by Position</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Sort by Rating</option>
          <option value="source">Sort by Source</option>
        </select>
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

