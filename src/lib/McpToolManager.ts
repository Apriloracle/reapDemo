import { agentStore } from '../stores/AgentStore';
import { dynamicToolStore } from '../stores/DynamicToolStore';
import { Agent } from '../types/firefly';

const DYNAMIC_SERVER_NAME = 'firefly-agents';

class McpToolManager {
  constructor() {
    // Listen for changes to the agents table
    agentStore.store.addTableListener('agents', (store, tableId, getCellChange) => {
      // We only care about new rows being added
      const changes = getCellChange?.();
      if (changes?.adds) {
        changes.adds.forEach((rowId) => {
          const agent = agentStore.getAgent(rowId) as unknown as Agent;
          if (agent) {
            this.processAgent(agent);
          }
        });
      }
    });
  }

  async processAgent(agent: Agent) {
    if (!agent.metadataUri) {
      console.log(`Agent ${agent.agentId} has no metadata URI. Skipping.`);
      return;
    }

    try {
      // In a real implementation, you would fetch the metadataUri
      // const response = await fetch(agent.metadataUri);
      // const metadata = await response.json();

      // For this example, we'll use mock metadata based on the URI
      const mockMetadata = this.getMockMetadata(agent.metadataUri);

      if (mockMetadata && mockMetadata.skills) {
        mockMetadata.skills.forEach((skill: any) => {
          console.log(`Creating tool for agent ${agent.agentId}, skill: ${skill.name}`);
          dynamicToolStore.addTool(DYNAMIC_SERVER_NAME, {
            name: `${agent.agentId}_${skill.name}`,
            description: skill.description,
            schema: skill.schema,
            // The handler would be dynamically constructed based on the skill's API
            // For now, we'll just log the call
            handler: `(args) => { console.log('Calling ${agent.agentId}_${skill.name} with:', args); return 'Tool executed'; }`,
          });
        });
      }
    } catch (error) {
      console.error(`Failed to process metadata for agent ${agent.agentId}:`, error);
    }
  }

  // This is a placeholder for fetching and parsing the metadata
  // In a real-world scenario, this would be a fetch call and JSON parse.
  getMockMetadata(uri: string): any {
    if (uri.includes('translator')) {
      return {
        skills: [{
          name: 'translate',
          description: 'Translates text from one language to another.',
          schema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              targetLanguage: { type: 'string' },
            },
            required: ['text', 'targetLanguage'],
          }
        }]
      };
    }
    return null;
  }
}

export const mcpToolManager = new McpToolManager();
