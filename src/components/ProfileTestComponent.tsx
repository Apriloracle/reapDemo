// src/components/ProfileTestComponent.tsx

import React, { useState, useRef } from 'react';
import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';
import { Hypervector } from '../lib/hypervectors';
import { Codebook } from '../config/hypervector-codebook';

const API_ENDPOINT = 'http://35.224.41.251:3333/search/vector'; // Using the same endpoint as ApiCaller

const ProfileTestComponent: React.FC = () => {
  const [categoryId, setCategoryId] = useState('76'); // Default to a test category
  const [clickCount, setClickCount] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [contaminant, setContaminant] = useState('sex_male');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = async () => {
    if (!categoryId.trim()) {
      alert('Please enter a category ID.');
      return;
    }

    try {
      const key = `category_${categoryId.trim()}`;
      console.log(`ProfileTestComponent: Simulating 'category_click' for item: "${key}"`);
      await hypervectorProfileStore.addInteraction('category_click', key);
      setClickCount(prev => prev + 1);
      console.log(`ProfileTestComponent: Interaction added. Total clicks for "${key}": ${clickCount + 1}`);
    } catch (error) {
      console.error('Error adding interaction:', error);
      alert('Failed to add interaction. See console for details.');
    }
  };

  const generateTestVector = (id: string): Int32Array => {
    console.log(`ProfileTestComponent: Creating isolated test vector for "category_${id}"`);
    const VECTOR_DIMENSION_10K = 10000;

    const zeroVector = new Float32Array(VECTOR_DIMENSION_10K);
    const itemVector = Codebook.get(`category_${id}`, VECTOR_DIMENSION_10K);
    const pureProfileVector = Hypervector.bundle(VECTOR_DIMENSION_10K, [zeroVector, itemVector]);
    const normalizedProfile = Hypervector.normalize(VECTOR_DIMENSION_10K, pureProfileVector);
    
    return new Int32Array(normalizedProfile.map(v => Math.round(v * 1000)));
  };

  const handleSendTestVector = async () => {
    if (!categoryId.trim()) {
      alert('Please enter a category ID.');
      return;
    }
    setIsTesting(true);
    try {
      const finalVector = generateTestVector(categoryId.trim());
      console.log(`ApiCaller: Sending isolated test vector of dimension ${finalVector.length} to ${API_ENDPOINT}...`);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: new Blob([finalVector.slice()]),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      console.log('--- ISOLATED CATEGORY TEST API RESULT ---');
      console.log('API Response:', result);
      console.log('---------------------------------------');
      alert('Isolated category test complete! Check the console for the API response.');

    } catch (err) {
      console.error('Error in isolated category test:', err);
      alert('Isolated category test failed. See console for details.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleContaminateAndSend = async () => {
    if (!fileInputRef.current?.files?.length) {
      alert('Please select a vector .bin file to upload.');
      return;
    }
    if (!contaminant.trim()) {
      alert('Please enter a contaminant attribute.');
      return;
    }
    setIsTesting(true);
    try {
      const file = fileInputRef.current.files[0];
      console.log(`ProfileTestComponent: Reading vector from file: ${file.name}`);
      
      const arrayBuffer = await file.arrayBuffer();
      const realProductVector = new Float32Array(arrayBuffer);
      const VECTOR_DIMENSION_10K = realProductVector.length;

      if (VECTOR_DIMENSION_10K !== 10000) {
        alert(`Warning: Uploaded vector has dimension ${VECTOR_DIMENSION_10K}, not 10000.`);
      }

      console.log(`ProfileTestComponent: Contaminating with attribute: "${contaminant}"`);

      const contaminantVector = Codebook.get(contaminant.trim(), VECTOR_DIMENSION_10K);
      const contaminatedVector = Hypervector.bundle(VECTOR_DIMENSION_10K, [realProductVector, contaminantVector]);
      const normalizedProfile = Hypervector.normalize(VECTOR_DIMENSION_10K, contaminatedVector);
      const finalVector = new Int32Array(normalizedProfile.map(v => Math.round(v * 1000)));

      console.log(`ApiCaller: Sending contaminated test vector of dimension ${finalVector.length} to ${API_ENDPOINT}...`);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: new Blob([finalVector.slice()]),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      console.log('--- CONTAMINATED TEST API RESULT ---');
      console.log('API Response:', result);
      console.log('----------------------------------');
      alert('Contaminated test complete! Check the console for the API response.');

    } catch (err) {
      console.error('Error in contaminated test:', err);
      alert('Contaminated test failed. See console for details.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #f05e23', borderRadius: '8px', marginTop: '1rem' }}>
      <h3 style={{ color: '#f05e23', marginTop: 0 }}>Profile Test Controller</h3>
      
      {/* Contamination Test Section */}
      <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #4A5568' }}>
        <h4>Contamination Test</h4>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <input type="file" ref={fileInputRef} accept=".bin" />
          <input
            type="text"
            value={contaminant}
            onChange={(e) => setContaminant(e.target.value)}
            placeholder="Contaminant (e.g., sex_male)"
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleContaminateAndSend}
            disabled={isTesting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1a202c',
              color: '#f05e23',
              border: '1px solid #f05e23',
              borderRadius: '4px',
              cursor: isTesting ? 'not-allowed' : 'pointer',
            }}
          >
            {isTesting ? 'Sending...' : 'Contaminate & Send'}
          </button>
        </div>
      </div>

      {/* Category Interaction Test Section */}
      <div>
        <h4>Category Interaction Test</h4>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <input
            type="text"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="Enter Category ID..."
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '200px',
            }}
          />
          <button
            onClick={handleAddClick}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f05e23',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add to Profile
          </button>
          <button
            onClick={() => handleSendTestVector()}
            disabled={isTesting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1a202c',
              color: '#f05e23',
              border: '1px solid #f05e23',
              borderRadius: '4px',
              cursor: isTesting ? 'not-allowed' : 'pointer',
            }}
          >
            {isTesting ? 'Sending...' : 'Send Isolated Test Vector'}
          </button>
        </div>
        <p style={{ color: '#A0AEC0', marginTop: '0.5rem' }}>
          Clicks added to main profile for "category_{categoryId}": {clickCount}
        </p>
      </div>
    </div>
  );
};

export default ProfileTestComponent;
