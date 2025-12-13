import { registerTinybaseTools } from './mcp-tinybase-adapter';
import * as stores from '../stores';
import { userProfileStore } from '../stores/UserProfileStore';
import { merchantProductsStore } from '../stores/MerchantProductsStore';
import { hypercoreService } from '../services/HypercoreService';

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
import { agentDataStore } from '../stores/AgentDataStore';

// Register a custom tool for the shoppingProductsStore
registerTool('getShoppingProducts', () => {
  return shoppingProductsStore.getProducts();
});

// Register a custom tool for the agentDataStore
registerTool('getAgentData', () => {
  return agentDataStore.getAgents();
});

// Register Hypercore tools that call the new client-side service
registerTool('startHypercoreAgent', async (args) => {
  const { coordinate } = args;
  return hypercoreService.startAgent(coordinate);
});

registerTool('startHypercoreManager', async (args) => {
  const { coordinate, instruction } = args;
  return hypercoreService.startManager(coordinate, instruction);
});

// Expose the invoke function globally for agents
import { invoke } from './mcp-engine';
if (typeof window !== 'undefined') {
  window.mcp = { invoke };
}
