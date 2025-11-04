import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoriteStore } from '../stores/FavoriteStore';
import styles from '../styles/ProductCard.module.css';
import BackButton from '../components/BackButton';

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
    <div style={{ padding: '1rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <BackButton />
        <h2 style={{ color: '#f05e23', margin: 0 }}>Cart</h2>
      </div>

      {favorites.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Your cart is empty.</p>
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
