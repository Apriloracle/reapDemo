import React, { useState, useEffect } from 'react';
import NTC from './NTC';
import ESN from './ESN';
import { createStore, Store } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { Persister } from 'tinybase/persisters';
import { NTCProvider } from '../contexts/NTCContext';
import SimpleVectorize from './SimpleVectorize';

interface BrainInitializerProps {
  children: React.ReactNode;
}

interface BrainState {
  ntc: {
    state: any; // Replace with a more specific type if possible
    weights: any;
    inputWeights: any;
    timeScales: any;
  };
  esn: {
    reservoirState: any;
    reservoirWeights: any;
    inputWeights: any;
  };
}

const BrainInitializer: React.FC<BrainInitializerProps> = ({ children }) => {
  const [ntc, setNtc] = useState<NTC | null>(null);
  const [esn, setEsn] = useState<ESN | null>(null);
  const [vectorInput, setVectorInput] = useState<number[][] | null>(null);

  const store = createStore();
  const persister = createLocalPersister(store, 'brain_state');

  useEffect(() => {
    const initialize = async () => {
      try {
        // Skip initialization of NTC and ESN for now
        console.log('NTC and ESN initialization skipped for performance optimization');
        return;
      } catch (error) {
        console.error('Error loading or saving state:', error);
      }
    };

    initialize();
  }, []);

  const updateTinybaseState = async () => {
    if (ntc && esn) {
      console.log('updateTinybaseState called');
      try {
        store.setRow('brain_state', 'row1', {
          'ntc.state': ntc.state,
          'ntc.weights': ntc.weights,
          'ntc.inputWeights': ntc.inputWeights,
          'ntc.timeScales': ntc.timeScales,
          'esn.reservoirState': esn.reservoirState,
          'esn.reservoirWeights': esn.reservoirWeights,
          'esn.inputWeights': esn.inputWeights,
        });
        await persister.save();
      } catch (error) {
        console.error('Error saving state:', error);
      }
    }
  };

  const handleVectorizedData = (vectors: number[][]) => {
    console.log('Received vectorized data in BrainInitializer:', vectors);
    setVectorInput(vectors);
  };

  useEffect(() => {
    if (ntc && vectorInput) {
      console.log('Updating NTC with vector input:', vectorInput);
      // Assuming you want to use the first vector as input for now
      if (vectorInput.length > 0) {
        ntc.update(vectorInput[0]);
      }
    }
  }, [ntc, vectorInput]);


  // Skip NTC and ESN checks and initialization
  return (
    // Pass null as NTC value since it's disabled
    <NTCProvider value={{ ntc: null }}>
      {children}
    </NTCProvider>
  );
};

export default BrainInitializer;

