import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../lib/types';
import styles from '../styles/ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onClick: (asin: string) => void;
}


const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const isGreatValue = (product.valueScore || 0) > 0.7;

  console.log('ProductCard received deal:', product.deal);
  let deal = null;
  try {
    deal = product.deal ? (typeof product.deal === 'string' ? JSON.parse(product.deal) : product.deal) : null;
  } catch (e) {
    console.error("Failed to parse deal in ProductCard:", e);
  }

  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [imageUrl]: true
    }));
  };

  return (
    <div
      onClick={() => onClick(product.asin)}
      className={styles.productCard}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(product.asin);
        }
      }}
    >
      <div className={styles.imageContainer}>
        {product.imageUrl && (
          <>
            {!loadedImages[product.imageUrl] && (
              <div className={styles.loadingIndicator}>
                Loading...
              </div>
            )}
            <img
              src={product.imageUrl}
              alt={product.name}
              onLoad={() => product.imageUrl && handleImageLoad(product.imageUrl)}
              className={styles.productImage}
              style={{
                opacity: loadedImages[product.imageUrl] ? 1 : 0,
              }}
            />
          </>
        )}
      </div>
      <div className={styles.productTitle}>
        {product.name}
      </div>
      {isGreatValue && (
        <div className={styles.greatValueBadge}>
          🏆 GREAT VALUE
          <div className={styles.greatValueSubtext}>✓ Top tier price & rating</div>
        </div>
      )}
      {deal && (
        <div className={styles.dealBadge} style={{ backgroundColor: deal.isExpiringSoon ? '#E53E3E' : '#38A169' }}>
          🏷️ {deal.discount || 'DEAL'}
          <div className={styles.dealSummary}>{deal.summary}</div>
          {deal.daysRemaining && (
            <div className={styles.dealSummary}>Expires in {deal.daysRemaining} days</div>
          )}
        </div>
      )}
      {product.priceDisplay && (
        <div className={styles.productPrice}>
          {product.priceDisplay}
        </div>
      )}
      {product.rating && (
        <div className={styles.productRating}>
          <span>{product.rating}★</span>
          <span>({product.ratingCount})</span>
        </div>
      )}
      {product.source && (
        <div className={styles.productSource}>
          {product.source}
        </div>
      )}
    </div>
  );
};

export default ProductCard;

