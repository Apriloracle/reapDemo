import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { Agent } from '../types/firefly';

class AgentStore {
  public store;
  private persister: any;

  constructor() {
    this.store = createStore();
    this.store.setSchema({
      agents: {
        agentId: { type: 'string' },
        wallet: { type: 'string' },
        metadataUri: { type: 'string' },
        timestamp: { type: 'string' },
      },
    });

    if (typeof window !== 'undefined') {
      this.persister = createLocalPersister(this.store, 'agentStore');
      this.persister.load();
    }
  }

  async addAgent(agent: Agent): Promise<void> {
    this.store.setRow('agents', agent.fireflyId, {
      agentId: agent.agentId,
      wallet: agent.wallet,
      metadataUri: agent.metadataUri,
      timestamp: agent.timestamp,
    });
    if (this.persister) {
      await this.persister.save();
    }
  }

  addAgents(agents: Agent[]): void {
    agents.forEach(agent => this.addAgent(agent));
  }

  async setAgents(agents: Agent[]): Promise<void> {
    const agentTable = agents.reduce((acc, agent) => {
      acc[agent.fireflyId] = {
        agentId: agent.agentId,
        wallet: agent.wallet,
        metadataUri: agent.metadataUri,
        timestamp: agent.timestamp,
      };
      return acc;
    }, {} as { [key: string]: any });
    this.store.setTable('agents', agentTable);
    if (this.persister) {
      await this.persister.save();
    }
  }

  getAgent(fireflyId: string) {
    return this.store.getRow('agents', fireflyId);
  }

  getAgents() {
    return this.store.getTable('agents');
  }
}

export const agentStore = new AgentStore();
