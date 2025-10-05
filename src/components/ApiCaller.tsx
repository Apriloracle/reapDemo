// src/components/ApiCaller.tsx

import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';

const API_ENDPOINT = 'http://35.224.41.251:3333/search/vector'; // <-- IMPORTANT: Replace with your actual API endpoint

export const callVectorSearchApi = async () => {
  try {
    console.log('ApiCaller: Getting 10k profile for API...');
    const profileVector = hypervectorProfileStore.getProfile10kForApi();

    console.log(`ApiCaller: Sending vector of dimension ${profileVector.length} to ${API_ENDPOINT}...`);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      // Create a new Blob from a copy of the vector to resolve type issues.
      body: new Blob([profileVector.slice()]),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    console.log('--- API CALLER RESULT ---');
    console.log('API Response:', result);
    console.log('-------------------------');
    
    return result; // Return the result for the caller to use

  } catch (err) {
    console.error('Error in ApiCaller:', err);
    throw err; // Re-throw the error for the caller to handle
  }
};
