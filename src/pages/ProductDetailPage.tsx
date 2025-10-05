import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/ProductDetail.module.css';
import { favoriteStore } from '../stores/FavoriteStore';
import { appendReferralCode } from '../utils/amazonUtils';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#000000',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '0.5rem 0',
      borderTop: '1px solid #333333'
    }}>
      {/* Home button */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: location.pathname === '/' ? '#f05e23' : '#fff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '4px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 21V13C15 12.7348 14.8946 12.4804 14.7071 12.2929C14.5196 12.1054 14.2652 12 14 12H10C9.73478 12 9.48043 12.1054 9.29289 12.2929C9.10536 12.4804 9 12.7348 9 13V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 9.99997C2.99993 9.70904 3.06333 9.42159 3.18579 9.15768C3.30824 8.89378 3.4868 8.65976 3.709 8.47197L10.709 2.47297C11.07 2.16788 11.5274 2.00049 12 2.00049C12.4726 2.00049 12.93 2.16788 13.291 2.47297L20.291 8.47197C20.5132 8.65976 20.6918 8.89378 20.8142 9.15768C20.9367 9.42159 21.0001 9.70904 21 9.99997V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V9.99997Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style={{ marginTop: '2px' }}>Home</span>
      </button>

      {/* Cart button */}
      <button
        onClick={() => navigate('/cart')}
        style={{
          background: 'none',
          border: 'none',
          color: location.pathname === '/cart' ? '#f05e23' : '#fff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '4px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ marginTop: '2px' }}>Cart</span>
      </button>

      {/* Profile button */}
      <button
        onClick={() => navigate('/profile')}
        style={{
          background: 'none',
          border: 'none',
          color: location.pathname === '/profile' ? '#f05e23' : '#fff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '4px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12C2 7.757 2 5.636 3.464 4.318C4.93 3 7.286 3 12 3C16.714 3 19.071 3 20.535 4.318C21.999 5.636 22 7.758 22 12C22 16.242 22 18.364 20.535 19.682C19.072 21 16.714 21 12 21C7.286 21 4.929 21 3.464 19.682C1.999 18.364 2 16.242 2 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 16H10M14 8H18M14 12H18M14 16H18M8.4 8H7.6C6.846 8 6.469 8 6.234 8.234C6 8.47 6 8.846 6 9.6V10.4C6 11.154 6 11.531 6.234 11.766C6.47 12 6.846 12 7.6 12H8.4C9.154 12 9.531 12 9.766 11.766C10 11.53 10 11.154 10 10.4V9.6C10 8.846 10 8.469 9.766 8.234C9.53 8 9.154 8 8.4 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style={{ marginTop: '2px' }}>Profile</span>
      </button>
    </div>
  );
};

const ProductDetailPage = () => {
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (product) {
      setIsFavorite(!!favoriteStore.getFavorite(product.asin));
    }
  }, [product]);

  const handleFavoriteClick = () => {
    if (product) {
      if (isFavorite) {
        favoriteStore.removeFavorite(product.asin);
        setIsFavorite(false);
      } else {
        favoriteStore.addFavorite({
          asin: product.asin,
          title: product.title,
          price: product.price,
          imageUrl: product.imgUrl,
          addedAt: new Date().toISOString(),
        });
        setIsFavorite(true);
      }
    }
  };

  const handleShareClick = () => {
    if (product) {
      const shareUrl = `${window.location.origin}/products/${product.asin}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        // Do nothing on success
      }, (err) => {
        console.error('Could not copy text: ', err);
      });
    }
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!asin) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://getproductdetails-50775725716.asia-southeast1.run.app/product/${asin}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch product details for ASIN: ${asin}`);
        }
        const productData = await response.json();
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [asin]);

  if (isLoading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  if (!product) {
    return <div className={styles.container}>Product not found.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className={styles.headerIcons}>
          <button className={styles.iconButton} onClick={handleFavoriteClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? '#f05e23' : ''} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button className={styles.iconButton} onClick={handleShareClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
        </div>
      </div>
      <div className={styles.productContent}>
        <div className={styles.imageContainer}>
          <img src={product.imgUrl} alt={product.title} className={styles.productImage} />
        </div>
      </div>
      <div className={styles.detailsContainer}>
        <p className={styles.price}>
          <span className={styles.dollarSign}>$</span>{product.price}
        </p>
        <h1 className={styles.title}>{product.title}</h1>
        <p className={styles.brand}>{product.brand}</p>
        {product.productURL && (
          <div className={styles.cartContainer}>
            <a href={appendReferralCode(product.productURL)} target="_blank" rel="noopener noreferrer" className={styles.buyButton} onClick={handleFavoriteClick}>
              <svg className={styles.cartIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ marginLeft: '0.5rem' }}>Buy</span>
            </a>
          </div>
        )}
        <div className={styles.attributes}>
          {product.attributes?.map((attr: string, index: number) => (
            <span key={index} className={styles.attribute}>{attr}</span>
          ))}
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default ProductDetailPage;

