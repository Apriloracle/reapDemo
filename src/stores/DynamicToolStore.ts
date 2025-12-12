import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

// The structure of a tool definition within the store
export interface ToolDefinition {
  name: string;
  description: string;
  // A JSON schema for the tool's arguments
  schema: Record<string, any>; 
  // The function to execute when the tool is called
  // It will be stored as a string and evaluated at runtime
  handler: string; 
}

class DynamicToolStore {
  public store;

  constructor() {
    this.store = createStore();
    // The table name will be the server name, and each row is a tool
    // This allows for multiple dynamic tool servers if needed in the future

    if (typeof window !== 'undefined') {
      const persister = createLocalPersister(this.store, 'dynamicToolStore');
      persister.startAutoLoad();
      persister.startAutoSave();
    }
  }

  addTool(serverName: string, tool: ToolDefinition) {
    this.store.setRow(serverName, tool.name, {
      description: tool.description,
      schema: JSON.stringify(tool.schema), // Store schema as a string
      handler: tool.handler, // Store handler function as a string
    });
  }

  getTool(serverName: string, toolName: string) {
    return this.store.getRow(serverName, toolName);
  }

  getServerTools(serverName: string) {
    return this.store.getTable(serverName);
  }
}

export const dynamicToolStore = new DynamicToolStore();

