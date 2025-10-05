// src/services/DataProbeService.ts

import { Hypervector } from '../lib/hypervectors';

const VECTOR_DIMENSION = 100000;

export const dataProbeService = {
  async runProbe(interactionData: string): Promise<void> {
    try {
      console.log('DataProbeService: Starting probe...');

      // 1. Load Catalog Vector
      console.log('DataProbeService: Fetching catalog vector...');
      const vectorResponse = await fetch('/catalog_vector_layer2.bin');
      if (!vectorResponse.ok) {
        throw new Error('Failed to fetch catalog vector.');
      }
      const buffer = await vectorResponse.arrayBuffer();
      const int8Vector = new Int8Array(buffer);
      const catalogVector = new Float32Array(int8Vector);
      console.log(`DataProbeService: Loaded catalog vector with dimension: ${catalogVector.length}`);

      // 2. Create Interaction Vector
      const interactionProfileVector = Hypervector.createRandom(VECTOR_DIMENSION, interactionData);
      console.log(`DataProbeService: Interaction vector created with dimension: ${interactionProfileVector.length}`);

      // 3. Perform Similarity Search
      console.log('DataProbeService: Performing similarity search...');
      if (interactionProfileVector.length !== catalogVector.length) {
        throw new Error(
          `Vector dimensions do not match! Interaction: ${interactionProfileVector.length}, Catalog: ${catalogVector.length}`
        );
      }
      const similarity = Hypervector.similarity(VECTOR_DIMENSION, interactionProfileVector, catalogVector);

      // 4. Log Result and Transfer Data
      console.log('--- DATA PROBE RESULT ---');
      console.log('Similarity score:', similarity);
      console.log('-------------------------');

      const interactionType = interactionData.includes('click') ? 'click' : 'view';
      
    } catch (err) {
      console.error('Error in DataProbeService:', err);
    }
  }
};
