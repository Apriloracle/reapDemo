import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import HypervectorSearchTest from './components/HypervectorSearchTest';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/hypervector-test" element={<HypervectorSearchTest />} />
    </Routes>
  );
};

export default App;
