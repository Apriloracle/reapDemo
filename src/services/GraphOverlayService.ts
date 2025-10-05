// src/services/GraphOverlayService.ts

import Graph from 'graphology';
import { userTrajectoryGraph } from '../components/UserTrajectoryGraph';
import mergedGraphData from '../data/graphs/merged_graph.json';

class GraphOverlayService {
  private isInitialized = false;

  public initialize() {
    if (this.isInitialized) {
      return;
    }

    // We need to wait for the main trajectory graph to be ready
    // before we can apply any overlays.
    userTrajectoryGraph.onInitialized(() => {
      this.applyOverlays();
    });

    this.isInitialized = true;
  }

  private applyOverlays() {
    console.log('GraphOverlayService: Applying graph overlays...');

    try {
      const graphToMerge = new Graph();
      graphToMerge.import(mergedGraphData as any);
      userTrajectoryGraph.mergeGraph(graphToMerge);
      console.log('GraphOverlayService: Successfully merged graph from imported data.');
    } catch (error) {
      console.error('GraphOverlayService: Failed to apply overlay from imported data', error);
    }

    console.log('GraphOverlayService: All graph overlays applied.');
  }
}

export const graphOverlayService = new GraphOverlayService();
