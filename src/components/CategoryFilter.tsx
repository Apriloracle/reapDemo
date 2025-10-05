// src/components/CategoryFilter.tsx

import React, { useState } from 'react';
import categoryIndex from '../data/index.json';
import { Z512Codebook } from '../config/z512-codebook';
import { Hypervector } from '../lib/hypervectors';
import { HypervectorProfileStore } from '../stores/HypervectorProfileStore';
import styles from '../styles/CategoryFilter.module.css';

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
    <div className={styles.categoryFilter}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.categoryButton} ${selectedCategories.size > 0 ? styles.selected : ''}`}
      >
        {selectedCategories.size > 0
          ? `${selectedCategories.size} Categories Selected`
          : 'Categories'}
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          {topCategories.map((category) => (
            <div key={category.categoryId} className={styles.categoryItem}>
              <label className={styles.categoryLabel}>
                <input
                  type="checkbox"
                  checked={selectedCategories.has(category.categoryId)}
                  onChange={() => handleCategoryToggle(category.categoryId)}
                  className={styles.checkbox}
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

