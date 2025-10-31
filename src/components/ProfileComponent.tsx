import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { userProfileStore } from '../stores/UserProfileStore';
import UserNet from './UserNet';
import { useSubdocument } from '../contexts/SubdocumentContext';
import { storeSubdocumentGUID } from '../utils/subdocumentUtils';

// -----------------------------
// Types
// -----------------------------
interface ProfileComponentProps {
  localWalletAddress: string | null;
  address: string | undefined;
}

interface FormData {
  sex: string;
  age: string;
  shoppingFrequency: string;
  interests: string[];
  shopping: string[];
  personality?: Record<string, number>; // Big Five scores (1–5)
  [key: string]: any;
}

// -----------------------------
// Shopping Personality Quiz Questions
// -----------------------------
const shoppingPersonalityQuestions = [
  {
    trait: 'AGR',
    text: 'When I shop, I care about supporting ethical or eco-friendly brands.',
    scale: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  },
  {
    trait: 'CON',
    text: 'Before buying something, I usually research reviews and compare options.',
    scale: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  },
  {
    trait: 'EXT',
    text: 'I enjoy discovering trending products or what others are buying.',
    scale: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  },
  {
    trait: 'NEU',
    text: 'I sometimes feel buyer’s remorse after a purchase.',
    scale: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  },
  {
    trait: 'OPE',
    text: 'I love trying new brands or experimental products.',
    scale: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  },
];

// -----------------------------
// Component
// -----------------------------
const ProfileComponent: React.FC<ProfileComponentProps> = ({ localWalletAddress, address }) => {
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [showBackupPopup, setShowBackupPopup] = useState<boolean>(false);
  const [backupData, setBackupData] = useState({
    cityOfBirth: '',
    mothersFirstName: '',
    email: ''
  });
  const { subdocumentGUID, setSubdocumentGUID } = useSubdocument();
  const [showBackupChoicePopup, setShowBackupChoicePopup] = useState<boolean>(false);
  const [showImportPopup, setShowImportPopup] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    sex: '',
    age: '',
    shoppingFrequency: '',
    interests: [],
    shopping: [],
    personality: {}
  });

  // -----------------------------
  // Load + Save
  // -----------------------------
  useEffect(() => {
    const savedData = localStorage.getItem('userProfile');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    }
  }, []);

  const saveToLocalStorage = (data: FormData) => {
    try {
      userProfileStore.saveProfile(data);
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  };

  // -----------------------------
  // Handlers for existing sections
  // -----------------------------
  const handleSexChange = (sex: string) => {
    const newData = { ...formData, sex };
    setFormData(newData);
    saveToLocalStorage(newData);
  };

  const handleAgeChange = (age: string) => {
    const newData = { ...formData, age };
    setFormData(newData);
    saveToLocalStorage(newData);
  };

  const handleFrequencyChange = (freq: string) => {
    const newData = { ...formData, shoppingFrequency: freq };
    setFormData(newData);
    saveToLocalStorage(newData);
  };

  const handleInterestChange = (interest: string) => {
    const newInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    const newData = { ...formData, interests: newInterests };
    setFormData(newData);
    saveToLocalStorage(newData);
  };

  const handleShoppingChange = (category: string) => {
    const newShopping = formData.shopping.includes(category)
      ? formData.shopping.filter(i => i !== category)
      : [...formData.shopping, category];
    const newData = { ...formData, shopping: newShopping };
    setFormData(newData);
    saveToLocalStorage(newData);
  };

  const handlePersonalityResponse = (trait: string, value: number) => {
    const newPersonality = {
      ...(formData.personality || {}),
      [trait]: value
    };
    const newData = { ...formData, personality: newPersonality };
    setFormData(newData);
    saveToLocalStorage(newData);
  };

  // -----------------------------
  // Backup logic
  // -----------------------------
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleBackupSync = () => setShowBackupChoicePopup(true);
  const handleBackupChoice = (hasBackup: boolean) => {
    setShowBackupChoicePopup(false);
    setShowBackupPopup(!hasBackup);
    setShowImportPopup(hasBackup);
  };

  const handleBackupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBackupData(prev => ({ ...prev, [name]: value }));
  };

  const generateGUID = async (data: typeof backupData) => {
    const combinedString = `${data.cityOfBirth}+${data.mothersFirstName}+${data.email}`;
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(combinedString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleImportSubmit = async () => {
    const guid = await generateGUID(backupData);
    setSubdocumentGUID(guid);
    setShowImportPopup(false);
  };

  const handleBackupSubmit = async () => {
    const guid = await generateGUID(backupData);
    setSubdocumentGUID(guid);
    storeSubdocumentGUID(guid);
    setShowBackupPopup(false);
  };

  // -----------------------------
  // Styles
  // -----------------------------
  const formButtonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#1A1A1A',
    color: 'white',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    marginRight: '0.5rem',
    marginBottom: '0.5rem'
  };

  const selectedFormButtonStyle = {
    ...formButtonStyle,
    backgroundColor: '#f05e23'
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#4A5568',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div style={{ padding: '1rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5" stroke="#f05e23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="#f05e23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 style={{ color: '#f05e23', margin: 0 }}>Profile</h2>
      </div>
      

      {/* ----------------- Personality Quiz ----------------- */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#f05e23' }}>🛍️ Shopping Personality</h3>
        {shoppingPersonalityQuestions.map((q, index) => (
          <div key={index} style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>{q.text}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <ChoiceButton
                  key={num}
                  active={formData.personality?.[q.trait] === num}
                  onClick={() => handlePersonalityResponse(q.trait, num)}
                >
                  {q.scale[num - 1]}
                </ChoiceButton>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sex */}
      <Section title="Sex">
        {['Male', 'Female'].map((sex) => (
          <ChoiceButton key={sex} active={formData.sex === sex} onClick={() => handleSexChange(sex)}>
            {sex}
          </ChoiceButton>
        ))}
      </Section>

      {/* Age */}
      <Section title="Age">
        {['14-18', '19-24', '25-30', '31-40', '41-50', '51-60'].map((age) => (
          <ChoiceButton key={age} active={formData.age === age} onClick={() => handleAgeChange(age)}>
            {age}
          </ChoiceButton>
        ))}
      </Section>

      {/* Shopping Frequency */}
      <Section title="How Frequent do You Shop Online">
        {['Never', 'Daily', 'Weekly', 'Monthly'].map((freq) => (
          <ChoiceButton key={freq} active={formData.shoppingFrequency === freq} onClick={() => handleFrequencyChange(freq)}>
            {freq}
          </ChoiceButton>
        ))}
      </Section>

      {/* Interests */}
      <Section title="Interest">
        {['Tech', 'Cars', 'Cooking', 'Fashion', 'Games', 'Art', 'Movies', 'Sports', 'Photography', 'Food'].map((interest) => (
          <ChoiceButton
            key={interest}
            active={formData.interests.includes(interest)}
            onClick={() => handleInterestChange(interest)}
          >
            {interest}
          </ChoiceButton>
        ))}
      </Section>

      {/* Shopping Categories */}
      <Section title="Shopping">
        {['Electronics', 'Gaming', 'Computing', 'Sporting Gear', 'Phones & Tablets', 'Appliance', 'Fashion'].map((category) => (
          <ChoiceButton
            key={category}
            active={formData.shopping.includes(category)}
            onClick={() => handleShoppingChange(category)}
          >
            {category}
          </ChoiceButton>
        ))}
      </Section>


      {/* Wallets + Backup */}
      {localWalletAddress && (
        <div style={{ marginBottom: '1rem', fontSize: '1rem', color: '#A0AEC0', wordBreak: 'break-all' }}>
          <strong>Local Wallet:</strong> {localWalletAddress}
        </div>
      )}
      {address && (
        <div style={{ marginBottom: '1rem', fontSize: '1rem', color: '#A0AEC0', wordBreak: 'break-all' }}>
          <strong>Connected Wallet:</strong> {address}
        </div>
      )}
      <button onClick={handleBackupSync} style={{ ...buttonStyle, width: '100%', marginBottom: '1rem' }}>Backup/Sync</button>
      {/* UserNet + Popups */}
      {subdocumentGUID && <UserNet />}
    </div>
  );
};

// -----------------------------
// Helper Components
// -----------------------------
const Section = ({ title, children }: any) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>{title}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>{children}</div>
  </div>
);

const ChoiceButton = ({ active, children, onClick }: any) => (
  <button
    onClick={onClick}
    style={{
      padding: '0.5rem 1rem',
      backgroundColor: active ? '#f05e23' : '#1A1A1A',
      color: 'white',
      border: 'none',
      borderRadius: '999px',
      cursor: 'pointer',
      marginRight: '0.5rem',
      marginBottom: '0.5rem'
    }}
  >
    {children}
  </button>
);

export default ProfileComponent;

