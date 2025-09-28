import React from 'react';
import SimilarProductsComponent from '../components/SimilarProductsComponent';

const SimilarProductsPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#000000', color: '#FFFFFF', padding: '1rem', maxWidth: '28rem', margin: '0 auto', fontFamily: 'sans-serif', minHeight: '100vh', position: 'relative' }}>
      <SimilarProductsComponent />
    </div>
  );
};

export default SimilarProductsPage;

