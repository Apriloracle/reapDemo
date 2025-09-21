// src/components/CategoryFilter.tsx

import React, { useState } from 'react';
import categoryIndex from '../data/index.json';
import { Z512Codebook } from '../config/z512-codebook';
import { Hypervector } from '../lib/hypervectors';
import { HypervectorProfileStore } from '../stores/HypervectorProfileStore';

interface Category {
  categoryId: number;
  categoryName: string;
}

interface CategoryFilterProps {
  onFilterChange: (selectedCategories: number[]) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ onFilterChange }) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const profileStore = HypervectorProfileStore.getInstance();

  const handleCategoryToggle = (categoryId: number) => {
    const newSelection = new Set(selectedCategories);
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    setSelectedCategories(newSelection);
    onFilterChange(Array.from(newSelection));

    // --- Vector Logic ---
    const fact = {
      attribute: 'category_selected',
      value: `category_${categoryId}`
    };

    // Add the fact to both the 10k and 100k profiles
    profileStore.addZ512Interaction(fact, 10000);
    profileStore.addZ512Interaction(fact, 100000);

    console.log(`Category ${categoryId} selection vector added to both profiles.`);
  };

  const topCategories = categoryIndex.slice(0, 15); // Show a manageable number of categories

  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#1a202c',
          color: '#f05e23',
          border: '1px solid #f05e23',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {selectedCategories.size > 0
          ? `${selectedCategories.size} Categories Selected`
          : 'Select Categories'}
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#2d3748',
          border: '1px solid #4A5568',
          borderRadius: '4px',
          marginTop: '0.25rem',
          padding: '0.5rem',
          zIndex: 10,
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {topCategories.map((category) => (
            <div key={category.categoryId} style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedCategories.has(category.categoryId)}
                  onChange={() => handleCategoryToggle(category.categoryId)}
                  style={{ marginRight: '0.5rem' }}
                />
                {category.categoryName}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
