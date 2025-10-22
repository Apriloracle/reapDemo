import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/ProductDetail.module.css';
import { shoppingProductsStore } from '../stores/ShoppingProductsStore';
import { favoriteStore } from '../stores/FavoriteStore';
import { Product } from '../lib/types';

// --- Bottom Navigation ---
const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navButton = (path: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => navigate(path)}
      style={{
        background: 'none',
        border: 'none',
        color: location.pathname === path ? '#f05e23' : '#fff',
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '4px',
      }}
    >
      {icon}
      <span style={{ marginTop: '2px' }}>{label}</span>
    </button>
  );

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000000',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.5rem 0',
        borderTop: '1px solid #333333',
      }}
    >
      {navButton('/', 'Home', (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 21V13C15 12.7348 14.8946 12.4804 14.7071 12.2929C14.5196 12.1054 14.2652 12 14 12H10C9.73478 12 9.48043 12.1054 9.29289 12.2929C9.10536 12.4804 9 12.7348 9 13V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9.99997C2.99993 9.70904 3.06333 9.42159 3.18579 9.15768C3.30824 8.89378 3.4868 8.65976 3.709 8.47197L10.709 2.47297C11.07 2.16788 11.5274 2.00049 12 2.00049C12.4726 2.00049 12.93 2.16788 13.291 2.47297L20.291 8.47197C20.5132 8.65976 20.6918 8.89378 20.8142 9.15768C20.9367 9.42159 21.0001 9.70904 21 9.99997V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V9.99997Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ))}
      {navButton('/deals', 'Deals', (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 6H17C17 3.2 14.8 1 12 1C9.2 1 7 3.2 7 6H5C3.9 6 3 6.9 3 8V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V8C21 6.9 20.1 6 19 6ZM12 3C13.7 3 15 4.3 15 6H9C9 4.3 10.3 3 12 3ZM19 20H5V8H19V20ZM12 12C10.3 12 9 10.7 9 9H7C7 11.8 9.2 14 12 14C14.8 14 17 11.8 17 9H15C15 10.7 13.7 12 12 12Z" fill="currentColor"/>
        </svg>
      ))}
      {navButton('/earn', 'Social', (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M17 22H5.266C4.982 22.0001 4.702 21.9398 4.443 21.8232C4.185 21.7066 3.954 21.5364 3.766 21.3238C3.579 21.1112 3.438 20.8611 3.355 20.5901C3.271 20.3191 3.246 20.0334 3.281 19.752L3.671 16.628C3.762 15.9022 4.114 15.2346 4.663 14.7506C5.211 14.2667 5.918 13.9997 6.649 14H7M19 14V18M17 16H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ))}
      {navButton('/profile', 'Profile', (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M2 12C2 7.757 2 5.636 3.464 4.318C4.93 3 7.286 3 12 3C16.714 3 19.071 3 20.535 4.318C21.999 5.636 22 7.758 22 12C22 16.242 22 18.364 20.535 19.682C19.072 21 16.714 21 12 21C7.286 21 4.929 21 3.464 19.682C1.999 18.364 2 16.242 2 12Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 16H10M14 8H18M14 12H18M14 16H18M8.4 8H7.6C6.846 8 6.469 8 6.234 8.234C6 8.47 6 8.846 6 9.6V10.4C6 11.154 6 11.531 6.234 11.766C6.47 12 6.846 12 7.6 12H8.4C9.154 12 9.531 12 9.766 11.766C10 11.53 10 11.154 10 10.4V9.6C10 8.846 10 8.469 9.766 8.234C9.53 8 9.154 8 8.4 8Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ))}
    </div>
  );
};

// --- Product Detail Page ---
const ProductDetailPage: React.FC = () => {
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (asin) {
      setIsFavorite(!!favoriteStore.getFavorite(asin));
    }
  }, [asin]);

  const handleFavorite = () => {
    if (!product) return;
    if (isFavorite) {
      favoriteStore.removeFavorite(product.asin);
    } else {
      favoriteStore.addFavorite(product);
    }
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that do not support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  useEffect(() => {
    if (!asin) return;
    try {
      const products = shoppingProductsStore.getProducts();
      const found = products.find((p: any) => p.asin === asin);
      if (found) setProduct(found as unknown as Product);
    } catch (err) {
      console.error('Error loading product:', err);
    }
  }, [asin]);

  if (!product) return <div className={styles.container}>Product not found.</div>;

  const isProduct = (p: any): p is Product => {
    return p && typeof p.asin === 'string' && typeof p.name === 'string';
  }

  if (!isProduct(product)) {
    return <div className={styles.container}>Invalid product data.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className={styles.productContent}>
        <div className={styles.imageContainer}>
          <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
        </div>
      </div>

      <div className={styles.detailsContainer}>
        <p className={styles.price}>{product.price}</p>
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.source}>{product.source}</p>

        <div className={styles.actionsContainer}>
          <button onClick={handleFavorite} className={styles.favoriteButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button onClick={handleShare} className={styles.shareButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </button>
        </div>

        {product.link && (
          <a href={product.link} target="_blank" rel="noopener noreferrer" className={styles.buyButton}>
            Buy Now
          </a>
        )}

        <div className={styles.attributes}>
          {product.attributes?.map((attr, i) => (
            <span key={i} className={styles.attribute}>{attr}</span>
          ))}
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default ProductDetailPage;




