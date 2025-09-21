// src/components/UserTrajectoryGraph.tsx

import { useEffect } from 'react';
import Graph from 'graphology';
import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';
import { get, set } from '../lib/indexedDbHelper';

const GRAPH_DB_KEY = 'user-trajectory-graph';

class UserTrajectoryGraph {
  private graph: Graph;
  private lastNodeId: string | null = null;
  private isInitialized: boolean = false;
  private pendingSnapshots: number[] = [];
  private onInitializedCallbacks: (() => void)[] = [];

  constructor() {
    this.graph = new Graph();
  }

  public async initialize() {
    if (this.isInitialized) {
      return;
    }

    const serializedGraph = await get<any>(GRAPH_DB_KEY);
    if (serializedGraph) {
      this.graph.import(serializedGraph);
      // Find the last node to continue the trajectory
      if (this.graph.order > 0) {
        this.lastNodeId = this.graph.nodes()[this.graph.order - 1];
      }
      console.log('UserTrajectoryGraph: Loaded graph from IndexedDB.');
    }

    this.isInitialized = true;
    this.processPendingSnapshots();

    // Notify all listeners that initialization is complete
    console.log('UserTrajectoryGraph: Initialization complete. Notifying listeners.');
    this.onInitializedCallbacks.forEach(callback => callback());
    this.onInitializedCallbacks = []; // Clear callbacks after firing
  }

  public onInitialized(callback: () => void) {
    if (this.isInitialized) {
      // If already initialized, call back immediately
      callback();
    } else {
      // Otherwise, add to the queue
      this.onInitializedCallbacks.push(callback);
    }
  }

  private async saveGraph() {
    const serializedGraph = this.graph.export();
    await set(GRAPH_DB_KEY, serializedGraph);
    console.log('UserTrajectoryGraph: Saved graph to IndexedDB.');
  }

  private processPendingSnapshots() {
    console.log(`UserTrajectoryGraph: Processing ${this.pendingSnapshots.length} pending snapshots.`);
    this.pendingSnapshots.forEach((score) => this.addProfileSnapshot(score));
    this.pendingSnapshots = []; // Clear the queue
  }

  public addProfileSnapshot = (similarityScore: number) => {
    if (!this.isInitialized) {
      console.log('UserTrajectoryGraph: Queuing snapshot, graph not initialized yet.');
      this.pendingSnapshots.push(similarityScore);
      return;
    }

    const userProfileVector = hypervectorProfileStore.getProfile();
    if (!userProfileVector || userProfileVector.length === 0) {
      console.warn('UserTrajectoryGraph: Cannot add snapshot without a valid user profile.');
      return;
    }

    const newNodeId = `profile_${Date.now()}`;
    this.graph.addNode(newNodeId, {
      timestamp: Date.now(),
      vector: Array.from(userProfileVector), // Store vector as a plain array for serialization
    });

    if (this.lastNodeId) {
      this.graph.addEdge(this.lastNodeId, newNodeId, {
        weight: similarityScore,
        type: 'trajectory_edge',
      });
    }

    this.lastNodeId = newNodeId;
    this.saveGraph();

    console.log(`UserTrajectoryGraph: Added new profile snapshot with ID ${newNodeId}.`);
    console.log('UserTrajectoryGraph: Current graph stats:', {
      nodes: this.graph.order,
      edges: this.graph.size,
    });
  };

  public getGraph(): Graph {
    return this.graph;
  }

  public mergeGraph(graphToMerge: Graph) {
    console.log('UserTrajectoryGraph: Merging external graph...');
    graphToMerge.forEachNode((node, attributes) => {
      this.graph.mergeNode(node, attributes);
    });

    graphToMerge.forEachEdge((edge, attributes, source, target) => {
      this.graph.mergeEdge(source, target, attributes);
    });

    console.log('UserTrajectoryGraph: Merge complete. New graph stats:', {
      nodes: this.graph.order,
      edges: this.graph.size,
    });

    this.saveGraph();
  }
}

export const userTrajectoryGraph = new UserTrajectoryGraph();

const UserTrajectoryGraphComponent: React.FC = () => {
  useEffect(() => {
    // This component is only for initializing the singleton.
    // The actual logic is handled by the class instance.
  }, []);

  return null;
};

export default UserTrajectoryGraphComponent;
