import CPPN from 'cppnjs/networks/cppn';
import cppnConnection from 'cppnjs/networks/cppnConnection';
import cppnActivationFactory from 'cppnjs/activationFunctions/cppnActivationFactory';

import { blake3Hash } from '@webbuf/blake3';
import { WebBuf } from 'webbuf';
import trajectoryStore from '../stores/TrajectoryStore';
import { userProfileStore } from '../stores/UserProfileStore';
import { discoverySearchStore } from '../stores/DiscoverySearchStore';
import modelData from '../data/query1_model.json';
import mergedGraphData from '../data/graphs/merged_graph.json';

// Helper function to hash a string into a fixed-length array of numbers
function hashToLatentVector(input: string): number[] {
  const data = new WebBuf(new TextEncoder().encode(input));
  const hash = blake3Hash(data).buf;
  // For simplicity, we'll take the first 3 bytes of the hash and normalize them to a range of -1 to 1
  return [
    (hash[0] / 255) * 2 - 1,
    (hash[1] / 255) * 2 - 1,
    (hash[2] / 255) * 2 - 1,
  ];
}

// Helper function to load the CPPN model from the JSON data
function loadCPPNFromJSON(modelData: any): any {
  const connections = modelData.connections.map(
    (conn: any) => new cppnConnection(conn.sourceIdx, conn.targetIdx, conn.weight)
  );
  const activationFunctions = (modelData.activationFunctions || []).map((name: string) =>
    cppnActivationFactory.getActivationFunction(name)
  );

  const loadedCppn = new CPPN(
    modelData.biasNeuronCount,
    modelData.inputNeuronCount,
    modelData.outputNeuronCount,
    modelData.totalNeuronCount,
    connections,
    modelData.biasList || [],
    activationFunctions
  );

  console.log(`✅ Loaded CPPN: ${modelData.totalNeuronCount} neurons, ${connections.length} connections`);
  return loadedCppn;
}

class MemoryStreamService {
  private cppn: any;
  private running: boolean = false;
  private isInitialized: boolean = false;
  private currentAsin: string | null = null;

  constructor() {
    // Constructor is now lightweight.
  }

  private async initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log("Initializing CPPN...");
    this.cppn = loadCPPNFromJSON(modelData);
    this.isInitialized = true;
  }

  public async startStream(asin: string) {
    this.currentAsin = asin;
    await this.initialize();
    if (this.running) {
      console.log("MemoryStreamService is already running.");
      return;
    }
    this.running = true;
    console.log("MemoryStreamService started.");
    
    setInterval(() => {
      if (this.running && this.currentAsin) {
        // 1. Hash the Tinybase state
        const tinybaseState = {
          trajectory: trajectoryStore.getTable("trajectory"),
          userProfile: userProfileStore.getProfile(),
          searchResults: discoverySearchStore.getAllProducts(),
        };
        const userStateVector = hashToLatentVector(JSON.stringify(tinybaseState));
        console.log("User State Latent Vector:", userStateVector);

        // 2. Hash the dynamically provided product pathway
        // @ts-ignore
        const priceBucketNode = mergedGraphData.nodes.find(node => 
          node.attributes.type === 'price_bucket' && 
          node.attributes.products && 
          this.currentAsin &&
          node.attributes.products.includes(this.currentAsin)
        );

        if (priceBucketNode) {
          // For this test, we'll just hash the attributes of the price bucket node.
          const productPathwayVector = hashToLatentVector(JSON.stringify(priceBucketNode.attributes));
          console.log(`Product Pathway Latent Vector for ${this.currentAsin}:`, productPathwayVector);
        } else {
          console.log(`Product with ASIN ${this.currentAsin} not found in any price_bucket.`);
        }
      }
    }, 2000); // Increased interval to 2 seconds to reduce console spam
  }

  stopStream() {
    if (!this.running) {
      console.log("MemoryStreamService is not running.");
      return;
    }
    this.running = false;
    console.log("MemoryStreamService stopped.");
  }

  public receiveProbeData(data: [number, number, number]) {
    if (!this.isInitialized) {
      console.log("MemoryStreamService not initialized, ignoring probe data.");
      return;
    }
    try {
      console.log("MemoryStreamService received probe data:", data);
      const output = this.cppn.activate(data);
      console.log("MemoryStreamService CPPN output:", output);
    } catch (error) {
      console.error("Error activating CPPN in MemoryStreamService:", error);
    }
  }
}

export const memoryStreamService = new MemoryStreamService();

