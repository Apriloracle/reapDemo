import { registerTool } from './mcp-engine';
import { hypercoreService } from '../services/HypercoreService';

// Register Hypercore tools that call the new client-side service
registerTool('startHypercoreAgent', async (args) => {
  const { coordinate } = args;
  return hypercoreService.startAgent(coordinate);
});

registerTool('startHypercoreManager', async (args) => {
  const { coordinate, instruction } = args;
  return hypercoreService.startManager(coordinate, instruction);
});
