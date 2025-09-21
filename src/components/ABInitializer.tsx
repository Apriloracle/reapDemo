import React, { useEffect, useState, ReactNode } from 'react';
import { useExperiment } from '../contexts/ExperimentContext';
import { ExperimentService } from '../services/ExperimentService';
import experimentsConfig from '../config/experiments.json';
import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

interface ABInitializerProps {
  children: ReactNode;
}

export const ABInitializer = ({ children }: ABInitializerProps) => {
  const { setAssignments } = useExperiment();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const getPeerDID = async (): Promise<string | null> => {
      const peerDIDStore = createStore();
      const peerDIDPersister = createLocalPersister(peerDIDStore, 'peer-did');
      await peerDIDPersister.load();
      const storedDID = peerDIDStore.getCell('peerDID', 'current', 'did');
      await peerDIDPersister.destroy(); // Clean up the persister instance
      return typeof storedDID === 'string' ? storedDID : null;
    };

    const initializeExperiments = async (peerDID: string) => {
      if (peerDID && !isInitialized) {
        const experimentNames = Object.keys(experimentsConfig);
        const variantPromises = experimentNames.map(name =>
          ExperimentService.getVariant(name, peerDID)
        );

        const results = await Promise.all(variantPromises);
        
        const newAssignments: Record<string, string> = {};
        experimentNames.forEach((name, index) => {
          newAssignments[name] = results[index];
        });

        setAssignments(newAssignments);
        setIsInitialized(true);
      }
    };

    const pollForPeerDID = async () => {
      const did = await getPeerDID();
      if (did) {
        initializeExperiments(did);
        return true; // Indicates the DID was found
      }
      return false; // Indicates the DID was not found
    };

    let intervalId: NodeJS.Timeout;

    // Poll immediately and then set an interval if not found
    pollForPeerDID().then(found => {
      if (!found) {
        intervalId = setInterval(() => {
          pollForPeerDID().then(foundInInterval => {
            if (foundInInterval) {
              clearInterval(intervalId);
            }
          });
        }, 500); // Check every 500ms
      }
    });

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isInitialized, setAssignments]);

  // Render children only after initialization is complete
  return isInitialized ? <>{children}</> : null; // Or a loading spinner
};
