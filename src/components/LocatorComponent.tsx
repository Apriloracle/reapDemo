import React, { useEffect } from 'react';
import moneygramDeveloper from '@api/moneygram-developer';

const LocatorComponent: React.FC = () => {
  useEffect(() => {
    const findAgents = async () => {
      try {
        const { data } = await moneygramDeveloper.agentLocator({
          address: '2990%20N%20Houston%20St%2075201',
          country: 'US',
          searchRadius: '5'
        });
        console.log('MoneyGram Agent Locator Results:', data);
      } catch (err) {
        console.error('Error fetching MoneyGram agents:', err);
      }
    };

    findAgents();
  }, []);

  // This component does not render any UI
  return null;
};

export default LocatorComponent;
