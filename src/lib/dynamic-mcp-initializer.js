import { registerTinybaseTools } from './mcp-tinybase-adapter';

// Initialize tools for the AgentStore
registerTinybaseTools('agentStore');

// Initialize tools for the DynamicToolStore
registerTinybaseTools('dynamicToolStore');

console.log(`✅ Initialized TinyBase Tools for agentStore and dynamicToolStore`);

