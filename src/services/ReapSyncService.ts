import { agentDataStore } from '../stores/AgentDataStore';
import { Agent } from '../types/firefly';

const REAP_NODE_URL = 'https://reapnode.reap.deals';

class ReapSyncService {
  constructor() {
    agentDataStore.addTableListener('agents', this.syncAgents.bind(this));
  }

  private async syncAgents() {
    const agents = agentDataStore.getTable('agents');
    if (!agents) {
      return;
    }

    for (const agentId in agents) {
      const agent = agents[agentId] as unknown as Agent;
      try {
        await fetch(`${REAP_NODE_URL}/api/storage`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: `agent:${agent.uaid}`,
            value: agent,
          }),
        });
      } catch (error) {
        console.error(`Failed to sync agent ${agent.uaid} to REAP node`, error);
      }
    }
  }
}

export const reapSyncService = new ReapSyncService();
