import { registerTinybaseTools } from './mcp-tinybase-adapter';
import * as stores from '../stores';
import { userProfileStore } from '../stores/UserProfileStore';
import { merchantProductsStore } from '../stores/MerchantProductsStore';

// Register all TinyBase stores with the MCP engine
Object.keys(stores).forEach(storeName => {
  if (storeName !== 'getStore') {
    registerTinybaseTools(storeName);
  }
});

// Initialize stores that require it
(async () => {
  if (typeof window !== 'undefined') {
    await userProfileStore.initialize();
    await merchantProductsStore.initialize();
  }
})();

import { registerTool } from './mcp-engine';
import { shoppingProductsStore } from '../stores/ShoppingProductsStore';

// Register a custom tool for the shoppingProductsStore
registerTool('getShoppingProducts', () => {
  return shoppingProductsStore.getProducts();
});

// Only import and register Hypercore tools on the server side
if (typeof window === 'undefined') {
  // Dynamic import for server-side only
  import('../services/HypercoreService').then(({ hypercoreService }) => {
    // Register Hypercore tools
    registerTool('startHypercoreAgent', (args) => {
      const { coordinate } = args;
      return hypercoreService.startAgent(coordinate);
    });

    registerTool('startHypercoreManager', (args) => {
      const { coordinate, privateKey, targetMetadata } = args;
      return hypercoreService.startManager(coordinate, privateKey, targetMetadata);
    });
  }).catch(err => {
    console.warn('Failed to load HypercoreService (expected in browser):', err.message);
  });
}

// Expose the invoke function globally for agents
import { invoke } from './mcp-engine';
if (typeof window !== 'undefined') {
  window.mcp = { invoke };
}
