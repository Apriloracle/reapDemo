// src/components/ProfileInspector.tsx

import React, { useEffect } from 'react';
import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';

const ProfileInspector: React.FC = () => {
  useEffect(() => {
    const inspectProfile = async () => {
      try {
        console.log('--- PROFILE INSPECTOR ---');
        await hypervectorProfileStore.initialize();
        const profileVector = hypervectorProfileStore.getProfile();

        if (!profileVector) {
          console.log('Profile vector not found.');
          console.log('-------------------------');
          return;
        }

        // Calculate magnitude
        const magnitude = Math.sqrt(profileVector.reduce((acc, val) => acc + val * val, 0));

        console.log(`Dimension: ${profileVector.length}`);
        console.log(`Magnitude: ${magnitude}`);
        console.log(`First 10 values: [${profileVector.slice(0, 10).join(', ')}]`);
        console.log('-------------------------');

      } catch (err) {
        console.error('Error in ProfileInspector:', err);
      }
    };

    inspectProfile();
  }, []);

  return null; // This component does not render anything.
};

export default ProfileInspector;
