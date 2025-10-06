import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { similarProductsStore } from '../stores/SimilarProductsStore';
import { categoryStore } from '../stores/CategoryStore';
import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';
import { graphSearchService } from '../services/GraphSearchService';
import styles from '../styles/ProductCard.module.css';
import LiqeSearchComponent from './LiqeSearchComponent';

interface SimilarProductsComponentProps {
  // No props needed as asin comes from URL params
}

const SimilarProductsComponent: React.FC<SimilarProductsComponentProps> = () => {
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [storeUpdate, setStoreUpdate] = useState(0);


  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!asin) {
        setError("Product ASIN not provided.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await similarProductsStore.initialize();
        const cachedProducts = similarProductsStore.getSimilarProducts(asin);

        if (cachedProducts.length > 0) {
          setSimilarProducts(cachedProducts);
          setIsLoading(false);
          return;
        }

        // 1. Call the similar products API
        const response = await fetch(`https://similarproductsapi-50775725716.asia-southeast1.run.app/similar/${asin}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch similar products for ASIN: ${asin}`);
        }
        const similarProductsResponse = await response.json(); // API returns an array directly

        if (!Array.isArray(similarProductsResponse)) {
          setError("Invalid response from similar products API: Expected an array.");
          setIsLoading(false);
          return;
        }

        const similarAsins = similarProductsResponse.map((p: any) => p.asin);

        // 2. Fetch product details for each ASIN
        const productDetailsPromises = similarAsins.map((asin: string) =>
          fetch(`https://getproductdetails-50775725716.asia-southeast1.run.app/product/${asin}`).then(res => res.json())
        );
        
        const productsDetails = await Promise.all(productDetailsPromises);
        const validProducts = productsDetails.filter(p => p && p.price > 0);
        
        setSimilarProducts(validProducts);
        if (asin) {
          await similarProductsStore.addSimilarProducts(asin, validProducts);
          // Also cache in categoryStore
          const productsByCategory: { [key: string]: any[] } = {};
          for (const product of validProducts) {
            const categoryId = product.categoryId || 'unknown';
            if (!productsByCategory[categoryId]) {
              productsByCategory[categoryId] = [];
            }
            productsByCategory[categoryId].push(product);
          }
          await categoryStore.addProductsByCategory(productsByCategory);
        }
        
      } catch (err) {
        console.error('Error fetching similar products:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [asin]);

  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [imageUrl]: true
    }));
  };

  const handleProductInteraction = (product: any, interactionType: 'click' | 'view') => {
    const interactionString = `Product ${product.asin} interacted: ${interactionType}`;
    console.log(interactionString);
    if (interactionType === 'click') {
      navigate(`/products/${product.asin}`, { state: { product } });
    }
  };

  const handleSearch = () => {
    navigate('/discovery');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            backgroundColor: 'transparent', 
            color: 'white', 
            border: 'none', 
            padding: '0', 
            borderRadius: '0', 
            cursor: 'pointer',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div style={{ flexGrow: 1, marginLeft: '1rem' }} onClick={handleSearch}>
          <LiqeSearchComponent onSearch={handleSearch} />
        </div>
      </div>
      <h2 style={{ color: '#f05e23', marginBottom: '1rem' }}></h2>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          Loading similar products...
        </div>
      )}

      {error && (
        <p style={{ color: 'red', marginBottom: '1rem' }}>Error: {error}</p>
      )}

      {!isLoading && !error && similarProducts.length === 0 && (
        <p style={{ textAlign: 'center', padding: '1rem' }}>No similar products found.</p>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '0.5rem' 
      }}>
        {similarProducts.map((product: any, index: number) => (
          <div 
            key={index}
            onClick={() => handleProductInteraction(product, 'click')}
            onMouseEnter={() => handleProductInteraction(product, 'view')}
            className={styles.productCard}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleProductInteraction(product, 'click');
              }
            }}
          >
            <div className={styles.imageContainer}>
              {product.imgUrl && (
                <>
                  {!loadedImages[product.imgUrl] && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#666'
                    }}>
                      Loading...
                    </div>
                  )}
                  <img
                    src={product.imgUrl}
                    alt={product.title}
                    onLoad={() => handleImageLoad(product.imgUrl)}
                    className={styles.productImage}
                    style={{
                      opacity: loadedImages[product.imgUrl] ? 1 : 0,
                    }}
                  />
                </>
              )}
            </div>
            <div className={styles.productTitle}>
              {product.title}
            </div>
            {product.price && (
              <div style={{ 
                color: '#f05e23',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}>
                <span style={{ fontSize: '0.85em', marginRight: '0.3em' }}>$</span>{product.price}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarProductsComponent;





