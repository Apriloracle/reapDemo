import React, { useState } from 'react';
import styles from '../styles/OnboardingFlow.module.css';
import { OnboardingChoices } from '../stores/UserProfileStore'; // Import the new type

// Define the props for the component, including a callback for when the flow is complete
interface OnboardingFlowProps {
  onComplete: (choices: OnboardingChoices) => void;
}

const archetypes = [
  { id: 'conscious-saver', icon: '🌱', label: '', description: 'I care about ethics + value' },
  { id: 'smart-researcher', icon: '🔍', label: '', description: 'I compare before I buy' },
  { id: 'trend-spotter', icon: '📈', label: '', description: 'I love what’s hot right now' },
  { id: 'deal-hunter', icon: '💡', label: '', description: 'I chase the lowest price' },
  { id: 'newbie-explorer', icon: '🧪', label: '', description: 'I try new brands often' },
];

const categories = [
    { id: 'groceries', icon: '🛒', label: 'Groceries' },
    { id: 'beauty', icon: '💄', label: 'Beauty' },
    { id: 'tech', icon: '💻', label: 'Tech' },
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'fashion', icon: '👗', label: 'Fashion' },
    { id: 'books', icon: '📚', label: 'Books' },
];

const alertOptions = [
    { id: 'cant-miss', icon: '🚨', label: 'Only for *can’t-miss* deals (1–2/week)' },
    { id: 'daily', icon: '🔔', label: 'Best deals daily' },
    { id: 'big-savings', icon: '💰', label: 'Only if I save 20%+' },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAlertStyle, setSelectedAlertStyle] = useState<string | null>(null);

  const handleArchetypeSelect = (archetypeId: string) => {
    setSelectedArchetypes(prev =>
      prev.includes(archetypeId)
        ? prev.filter(id => id !== archetypeId)
        : [...prev, archetypeId].slice(0, 2) // Allow up to 2 selections
    );
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev =>
        prev.includes(categoryId)
            ? prev.filter(id => id !== categoryId)
            : [...prev, categoryId]
    );
  };

  const handleAlertSelect = (alertId: string) => {
    setSelectedAlertStyle(alertId);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContainer}>
            <h2 className={styles.title}>What kind of shopper are you?</h2>
            <p>Select up to two that fit you best.</p>
            <div className={styles.archetypeGrid}>
              {archetypes.map(archetype => (
                <div
                  key={archetype.id}
                  className={`${styles.archetypeCard} ${selectedArchetypes.includes(archetype.id) ? styles.selected : ''}`}
                  onClick={() => handleArchetypeSelect(archetype.id)}
                >
                  <div className={styles.archetypeIcon}>{archetype.icon}</div>
                  <div className={styles.archetypeLabel}>{archetype.label}</div>
                  <div className={styles.archetypeDescription}>{archetype.description}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
            <div className={styles.stepContainer}>
              <h2 className={styles.title}>Pick your top 3 categories</h2>
              <p>We'll watch for deals in the categories you love.</p>
              <div className={styles.categoryGrid}>
                {categories.map(category => (
                  <div
                    key={category.id}
                    className={`${styles.categoryCard} ${selectedCategories.includes(category.id) ? styles.selected : ''}`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className={styles.categoryIcon}>{category.icon}</div>
                    <div className={styles.categoryLabel}>{category.label}</div>
                  </div>
                ))}
              </div>
            </div>
        );
      case 3:
        return (
            <div className={styles.stepContainer}>
                <h2 className={styles.title}>Set your deal alert style</h2>
                <p>How should we notify you?</p>
                <div className={styles.alertOptionsContainer}>
                    {alertOptions.map(option => (
                        <div
                            key={option.id}
                            className={`${styles.alertOption} ${selectedAlertStyle === option.id ? styles.selected : ''}`}
                            onClick={() => handleAlertSelect(option.id)}
                        >
                            <span className={styles.alertIcon}>{option.icon}</span>
                            <span className={styles.alertLabel}>{option.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.onboardingFlowContainer}>
      {renderStep()}
      <div className={styles.navigationButtons}>
        {step > 1 && <button onClick={() => setStep(step - 1)}>Back</button>}
        {step < 3 && <button onClick={() => setStep(step + 1)} disabled={(step === 1 && selectedArchetypes.length === 0) || (step === 2 && selectedCategories.length < 3)}>Next</button>}
        {step === 3 && <button onClick={() => onComplete({ archetypes: selectedArchetypes, categories: selectedCategories, alertStyle: selectedAlertStyle })} disabled={!selectedAlertStyle}>Finish</button>}
      </div>
    </div>
  );
};

export default OnboardingFlow;
