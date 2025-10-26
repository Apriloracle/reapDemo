import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../lib/types';
import styles from '../styles/ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onClick: (asin: string) => void;
  valueScore?: number;
}


const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, valueScore = 0 }) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const isGreatValue = valueScore > 0.6;

  console.log(product.name, valueScore);

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


