import React, { useState, useEffect } from 'react';
import NTC from './NTC';
import ESN from './ESN';
import { createStore, Store } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { Persister } from 'tinybase/persisters';
import { NTCProvider } from '../contexts/NTCContext';
import { deviceDataStore } from '../stores/DeviceDataStore';
import SimpleVectorize from './SimpleVectorize';
import CoordinateCountDisplay from './CoordinateCountDisplay';
import OnboardingFlow from './OnboardingFlow'; // Import the OnboardingFlow component
import userProfileStore, { OnboardingChoices } from '../stores/UserProfileStore';
import { initializeCisInstructionStore } from '../stores/CisInstructionStore';
import { populateCisInstructionStore } from '../lib/populateCisInstructionStore';
import { ReapSyncService } from '../services/ReapSyncService';

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false); // State to control rendering

  const store = createStore();
  const persister = createLocalPersister(store, 'brain_state');

useEffect(() => {
  const initialize = async () => {
    try {
      const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }

      setTimeout(() => {
        deviceDataStore.fetchAndStoreDeviceData();
      }, 100);

      await initializeCisInstructionStore();
      await populateCisInstructionStore();

      // 🔁 Initialize ReapSyncService (fire-and-forget)
      try {
        const reapSync = ReapSyncService.getInstance();
        reapSync.init({
          deviceStore: deviceDataStore,
          userProfileStore,
        });
      } catch (syncError) {
        console.warn('ReapSyncService failed to initialize:', syncError);
      }

      console.log('NTC and ESN initialization skipped for performance optimization');

      setIsReady(true);
    } catch (error) {
      console.error('Error during initialization:', error);
      setIsReady(true);
    }
  };

  initialize();
}, []);

  const handleOnboardingComplete = async (choices: OnboardingChoices) => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    
    // Use the existing store method to save the choices
    await userProfileStore.updateProfile({ onboardingChoices: choices });

    setShowOnboarding(false);
  };

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


  if (!isReady) {
    return null; // Don't render anything until initialization checks are complete
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // If onboarding is complete, render the main app
  return (
    <NTCProvider value={{ ntc: null }}>
      <CoordinateCountDisplay />
      {children}
    </NTCProvider>
  );
};

export default BrainInitializer;

