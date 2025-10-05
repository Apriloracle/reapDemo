import React, { useEffect, useState } from 'react';
import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';
import { userTrajectoryGraph } from './UserTrajectoryGraph';
import { categoryVectorService } from '../services/CategoryVectorService';
import { graphOverlayService } from '../services/GraphOverlayService';

interface VectorInitializerProps {
  onInitialized: () => void;
}

const VectorInitializer: React.FC<VectorInitializerProps> = ({ onInitialized }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('VectorInitializer: Starting initialization...');
        await Promise.all([
          hypervectorProfileStore.initialize(),
          userTrajectoryGraph.initialize(),
        ]);
        
        // Initialize the GraphOverlayService after the main graph is ready.
        graphOverlayService.initialize();

        console.log('VectorInitializer: Initialization complete.');
        setIsInitialized(true);
        onInitialized();
      } catch (error) {
        console.error('VectorInitializer: Error during initialization:', error);
      }
    };

    initialize();
  }, [onInitialized]);

  if (!isInitialized) {
    return <div>Initializing Vectors...</div>;
  }

  // The initializer's job is done, so it renders nothing.
  // The parent component (`BrainInitializer`) will render the main app UI.
  return null;
};

export default VectorInitializer;
