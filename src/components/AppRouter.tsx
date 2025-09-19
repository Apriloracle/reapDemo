import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';

const AppRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof window === 'undefined') {
    return <StaticRouter location="/">{children}</StaticRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
};

export default AppRouter;
