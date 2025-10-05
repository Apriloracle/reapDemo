// src/components/VectorGenerator.tsx

import React from 'react';
import { Hypervector } from '../lib/hypervectors';
import { Codebook } from '../config/hypervector-codebook';

const VectorGenerator: React.FC = () => {

  const handleGenerateAndDownload = () => {
    console.log('VectorGenerator: Generating test vector...');

    // 1. Simulate building a user profile
    const interaction1 = Hypervector.bind(
      10000,
      Codebook.get('product_click', 10000),
      Codebook.get('electronics', 10000)
    );
    const interaction2 = Hypervector.bind(
      10000,
      Codebook.get('product_view', 10000),
      Codebook.get('books', 10000)
    );
    const interaction3 = Hypervector.bind(
      10000,
      Codebook.get('product_view', 10000),
      Codebook.get('sports', 10000)
    );

    const profileVector = Hypervector.bundle(10000, [interaction1, interaction2, interaction3]);
    console.log('VectorGenerator: Sample profile created.');

    // 2. Normalize and convert to Int8Array for file export
    const normalizedVector = Hypervector.normalize(10000, profileVector);
    const int8Vector = new Int8Array(normalizedVector.map(v => Math.round(v * 127)));
    console.log(`VectorGenerator: Converted to Int8Array with dimension ${int8Vector.length}.`);

    // 3. Create and trigger download
    const blob = new Blob([int8Vector.buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_profile.bin';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('VectorGenerator: Download triggered.');
  };

  return (
    <div style={{ padding: '1rem', textAlign: 'center', border: '1px solid #f05e23', margin: '1rem' }}>
      <h3 style={{ color: '#f05e23' }}>Test Vector Generator</h3>
      <p>Click the button to generate and download a sample 100k-dimension user profile vector.</p>
      <button 
        onClick={handleGenerateAndDownload}
        style={{ 
          backgroundColor: '#f05e23', 
          color: 'white', 
          border: 'none', 
          padding: '0.5rem 1rem', 
          borderRadius: '4px', 
          cursor: 'pointer'
        }}
      >
        Generate & Download Test Vector
      </button>
    </div>
  );
};

export default VectorGenerator;
