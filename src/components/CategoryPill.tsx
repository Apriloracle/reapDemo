import React from 'react';
import styles from '../styles/CategoryPill.module.css';

interface CategoryPillProps {
  categoryName: string;
  isSelected: boolean;
  onClick: (categoryName: string) => void;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ categoryName, isSelected, onClick }) => {
  return (
    <button
      className={`${styles.pillButton} ${isSelected ? styles.selected : ''}`}
      onClick={() => onClick(categoryName)}
    >
      {categoryName}
    </button>
  );
};

export default CategoryPill;
