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
import { agentDataStore, getAgents } from '../stores/AgentDataStore';

// Register a custom tool for the shoppingProductsStore
registerTool('getShoppingProducts', () => {
  return shoppingProductsStore.getProducts();
});

// Register a custom tool for the agentDataStore
registerTool('getAgentData', () => {
  return getAgents();
});

// Register Hypercore tools that call API routes instead of direct service
registerTool('startHypercoreAgent', async (args) => {
  const { coordinate } = args;
  const response = await fetch('/api/hypercore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'agent', coordinate })
  });
  return response.json();
});

registerTool('startHypercoreManager', async (args) => {
  const { coordinate, privateKey, targetMetadata } = args;
  const response = await fetch('/api/hypercore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'manager', coordinate, privateKey, targetMetadata })
  });
  return response.json();
});

// Expose the invoke function globally for agents
import { invoke } from './mcp-engine';
if (typeof window !== 'undefined') {
  window.mcp = { invoke };
}
