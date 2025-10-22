import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import discoveryStyles from '../styles/DiscoveryPage.module.css';
import { Product } from '../lib/types';

const ShoppingResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shoppingComparisonResults } = location.state || {};

  const handleProductClick = (product: Product) => {
    if (product && product.asin) {
      navigate(`/products/${product.asin}`);
    }
  };

  return (
    <div className={discoveryStyles.page}>
      <div className={discoveryStyles.searchHeader}>
        <button onClick={() => navigate(-1)} className={discoveryStyles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1></h1>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <div className={discoveryStyles.productGrid}>
          {shoppingComparisonResults?.shopping?.map((product: any) => (
            <ProductCard
              key={product.productId}
              product={{
                asin: product.productId,
                name: product.title,
                imageUrl: product.imageUrl,
                price: parseFloat(product.price.replace('$', '')),
                source: product.source,
                link: product.link,
              }}
              onClick={() => handleProductClick({ asin: product.productId, name: product.title })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShoppingResultsPage;
