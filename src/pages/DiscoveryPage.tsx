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
import BackButton from '../components/BackButton';
import { calculateValueScores } from '../utils/valueScoreCalculator';
import { getDealsIndexes, getDealsIndexStore } from '../stores/DealsIndexStore';

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortOrder, setSortOrder] = useState('position');

  useEffect(() => {
    // Check if products exist and if they already have scores
    if (products.length > 0 && typeof products[0].valueScore === 'undefined') {
      const scores = calculateValueScores(products);
      const productsWithScores = products.map(p => ({
        ...p,
        valueScore: scores.get(p.asin) || 0,
      }));
      setProducts(productsWithScores);
    }
  }, [products]);

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
    
    const scores = calculateValueScores(formattedProducts);
    
    const dealsIndexes = getDealsIndexes();
    const dealsStore = getDealsIndexStore();
    let productsWithScores = formattedProducts.map(p => {
      const brand = p.name.split(' ')[0];
      const dealIds = dealsIndexes.getSliceRowIds('byMerchant', brand);
      let bestDeal = null;
      if (dealIds && dealIds.length > 0) {
        const deal = dealsStore.getRow('deals', dealIds[0]);
        if (deal && deal.codes) {
          try {
            bestDeal = JSON.parse(deal.codes as string)[0];
          } catch (e) {
            console.error("Failed to parse deal codes:", e);
          }
        }
      }

      return {
        ...p,
        valueScore: scores.get(p.asin) || 0,
        deal: bestDeal ? JSON.stringify(bestDeal) : '',
      };
    });

    // Now, save the enriched products to the DealsIndexStore
    productsWithScores.forEach(p => {
      dealsStore.setRow('searchResults', p.asin, {
        name: p.name,
        source: p.source,
        price: p.price,
        rating: p.rating,
        ratingCount: p.ratingCount,
        deal: p.deal ? JSON.stringify(p.deal) : '',
      });
    });

    setProducts(productsWithScores);
    applySort(sortOrder, productsWithScores);

    console.log('DealsIndexStore searchResults:', dealsStore.getTable('searchResults'));

    await shoppingProductsStore.addProducts(productsWithScores);
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
    } else if (sortOrder === 'best-value') {
      sortedProducts = [...productsToSort].sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0));
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
        <BackButton />
        
        <LiqeSearchComponent 
          ref={searchInputRef} 
          onSearchResults={handleSearchResults} 
        />
      </div>

      <div className={discoveryStyles.sortContainer}>
        <select value={sortOrder} onChange={handleSortChange} className={discoveryStyles.sortDropdown}>
          <option value="position">Sort by Rank</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Sort by Rating</option>
          <option value="source">Sort by Source</option>
          <option value="best-value">Sort by Best Value</option>
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




