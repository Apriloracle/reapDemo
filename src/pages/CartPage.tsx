import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoriteStore } from '../stores/FavoriteStore';
import styles from '../styles/ProductCard.module.css';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    const items = favoriteStore.getFavorites();
    setFavorites(items);
  }, []);

  const handleRemove = (asin: string) => {
    favoriteStore.removeFavorite(asin);
    setFavorites(favoriteStore.getFavorites());
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: '#000000', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 style={{ color: '#f05e23', margin: 0 }}>Cart</h2>
      </div>

      {favorites.length === 0 ? (
        <p style={{ color: 'white', textAlign: 'center' }}>Your cart is empty.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {favorites.map((item) => (
            <div key={item.asin} className={styles.productCard} onClick={() => navigate(`/products/${item.asin}`)}>
              <div className={styles.imageContainer}>
                <img src={item.imageUrl} alt={item.title} className={styles.productImage} />
              </div>
              <div className={styles.productTitle}>{item.title}</div>
              <div style={{ color: '#f05e23', fontSize: '1rem', fontWeight: 'bold' }}>
                ${item.price}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.asin);
                }}
                style={{
                  backgroundColor: '#f05e23',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CartPage;
