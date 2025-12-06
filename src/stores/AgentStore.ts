import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { Agent } from '../types/firefly';
import { getCoordinateForData } from '../lib/probeUtils';

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
        metadata: { type: 'string', default: '' },
        capabilities: { type: 'string', default: '' },
      },
    });

    if (typeof window !== 'undefined') {
      this.persister = createLocalPersister(this.store, 'agentStore');
      this.persister.load();
    }
  }

  async addAgent(agent: Agent): Promise<void> {
    const capabilities = agent.metadata ? JSON.parse(agent.metadata).capabilities || [] : [];
    for (const capability of capabilities) {
      capability.coordinate = await getCoordinateForData({
        name: capability.name,
        description: capability.description,
      });
    }

    this.store.setRow('agents', agent.fireflyId, {
      agentId: agent.agentId,
      wallet: agent.wallet,
      metadataUri: agent.metadataUri,
      timestamp: agent.timestamp,
      metadata: agent.metadata || '',
      capabilities: JSON.stringify(capabilities),
    });
    if (this.persister) {
      await this.persister.save();
    }
  }

  addAgents(agents: Agent[]): void {
    agents.forEach(agent => this.addAgent(agent));
  }

  async setAgents(agents: Agent[]): Promise<void> {
    const agentTable: { [key: string]: any } = {};
    for (const agent of agents) {
      const capabilities = agent.metadata ? JSON.parse(agent.metadata).capabilities || [] : [];
      for (const capability of capabilities) {
        capability.coordinate = await getCoordinateForData({
          name: capability.name,
          description: capability.description,
        });
      }
      agentTable[agent.fireflyId] = {
        agentId: agent.agentId,
        wallet: agent.wallet,
        metadataUri: agent.metadataUri,
        timestamp: agent.timestamp,
        metadata: agent.metadata || '',
        capabilities: JSON.stringify(capabilities),
      };
    }
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

