import { agentDataStore } from '../stores/AgentDataStore';
import { Agent } from '../types/firefly';

const REAP_NODE_URL = 'https://reapnode.reap.deals';

interface ReapSyncConfig {
  deviceStore?: any;
  userProfileStore?: any;
}

class ReapSyncService {
  private deviceStore?: any;
  private userProfileStore?: any;

  constructor() {
    agentDataStore.addTableListener('agents', this.syncAgents.bind(this));
  }

  public init(config: ReapSyncConfig) {
    this.deviceStore = config.deviceStore;
    this.userProfileStore = config.userProfileStore;
    console.log('ReapSyncService initialized with stores');
  }

  private async syncAgents() {
    const agents = agentDataStore.getTable('agents');
    if (!agents) {
      return;
    }

    for (const agentId in agents) {
      const agent = agents[agentId] as any; // Use 'any' since the stored data structure differs from Agent type
      try {
        await fetch(`${REAP_NODE_URL}/api/storage`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: `agent:${agent.uaid || agentId}`, // Use uaid if available, otherwise use the agentId key
            value: agent,
          }),
        });
      } catch (error) {
        console.error(`Failed to sync agent ${agent.uaid || agentId} to REAP node`, error);
      }
    }
  }
}

export const reapSyncService = new ReapSyncService();
