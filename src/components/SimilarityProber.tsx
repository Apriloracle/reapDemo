// src/components/SimilarityProber.tsx

import React, { useEffect } from 'react';
import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';
import { Hypervector } from '../lib/hypervectors';

const VECTOR_DIMENSION = 100000;

interface SimilarityProberProps {
  onSimilarityCalculated: (score: number) => void;
}

const SimilarityProber: React.FC<SimilarityProberProps> = ({ onSimilarityCalculated }) => {
  useEffect(() => {
    const runProbe = async () => {
      try {
        console.log('SimilarityProber: Starting probe...');

        // 1. Load Catalog Vector
        console.log('SimilarityProber: Fetching catalog vector...');
        const vectorResponse = await fetch('/catalog_vector_layer2.bin');
        if (!vectorResponse.ok) {
          throw new Error('Failed to fetch catalog vector.');
        }
        const buffer = await vectorResponse.arrayBuffer();
        // The binary file is encoded as 8-bit integers.
        const int8Vector = new Int8Array(buffer);
        // Convert to Float32Array to match the user profile's type.
        const catalogVector = new Float32Array(int8Vector);
        console.log(`SimilarityProber: Loaded catalog vector with dimension: ${catalogVector.length}`);

        // 2. Get User Profile
        await hypervectorProfileStore.initialize();
        const userProfileVector = hypervectorProfileStore.getProfile();
        if (!userProfileVector) {
          console.log('SimilarityProber: User profile vector not available yet.');
          return;
        }
        console.log(`SimilarityProber: User profile vector retrieved with dimension: ${userProfileVector.length}`);

        // 3. Perform Similarity Search
        console.log('SimilarityProber: Performing similarity search...');
        if (userProfileVector.length !== catalogVector.length) {
          throw new Error(
            `Vector dimensions do not match! User: ${userProfileVector.length}, Catalog: ${catalogVector.length}`
          );
        }
        const similarity = Hypervector.similarity(VECTOR_DIMENSION, userProfileVector, catalogVector);

        // 4. Log Result and Pass to Callback
        console.log('--- SIMILARITY PROBE RESULT ---');
        console.log('Similarity score:', similarity);
        console.log('-----------------------------');
        onSimilarityCalculated(similarity);

      } catch (err) {
        console.error('Error in SimilarityProber:', err);
      }
    };

    runProbe();
  }, []);

  return null; // This component does not render anything.
};

export default SimilarityProber;
