import { Mcp } from './mcp-engine';
import { TinyBaseMcpAdapter } from './mcp-tinybase-adapter';
import { agentStore } from '../stores/AgentStore';
import { dynamicToolStore } from '../stores/DynamicToolStore';

const DYNAMIC_SERVER_NAME = 'firefly-agents';

// Create a new MCP server instance specifically for dynamic tools
const dynamicMcp = new Mcp(DYNAMIC_SERVER_NAME);

// Create an adapter for the AgentStore (Resources)
const agentStoreAdapter = new TinyBaseMcpAdapter(
  agentStore.store,
  {
    resources: {
      // Expose the 'agents' table as a resource
      '/agents': 'agents', 
    }
  }
);

// Create an adapter for the DynamicToolStore (Tools)
const dynamicToolStoreAdapter = new TinyBaseMcpAdapter(
  dynamicToolStore.store,
  {
    tools: {
      // The table name in this store corresponds to the server name
      // and each row is a tool. We will use our server name as the table.
      [DYNAMIC_SERVER_NAME]: DYNAMIC_SERVER_NAME,
    }
  }
);

// Register the adapters with our new MCP server
dynamicMcp.registerAdapter(agentStoreAdapter);
dynamicMcp.registerAdapter(dynamicToolStoreAdapter);

console.log(`✅ Initialized Dynamic MCP Server: ${DYNAMIC_SERVER_NAME}`);

// Expose the server instance if needed elsewhere
export { dynamicMcp };
