// src/services/GraphSearchService.ts

import { userTrajectoryGraph } from '../components/UserTrajectoryGraph';

class GraphSearchService {
  public findUserInteractions(userId: string, action: string): string[] {
    const graph = userTrajectoryGraph.getGraph();
    const userNode = `user_${userId}`;

    if (!graph.hasNode(userNode)) {
      console.warn(`GraphSearchService: User node ${userNode} not found.`);
      return [];
    }

    const interactedAsins: string[] = [];
    graph.forEachOutboundEdge(userNode, (edge, attributes, source, target) => {
      if (attributes.action === action) {
        // Assuming the target node is the ASIN
        interactedAsins.push(target);
      }
    });

    return interactedAsins;
  }
}

export const graphSearchService = new GraphSearchService();
