// --- START OF FILE UserProfileStore.ts (Corrected) ---

import { createStore, Store, Row } from 'tinybase';
// FIX: We import the TYPE of the persister, not the creation function at the top level.
import { Persister } from 'tinybase/persisters'; 
import { upsertUserProfile } from './ProductIndexStore';

// Base interface for type safety when working with profiles
interface BaseUserProfile {
  sex: string;
  age: string;
  shoppingFrequency: string;
  interests: string[];
  shopping: string[];
}

// Extended interface with index signature for TinyBase compatibility
export interface UserProfile extends BaseUserProfile {
  [key: string]: string | string[];
}

type ProfileChangeListener = (profile: UserProfile) => void;

class UserProfileStore {
  private store: Store;
  // FIX: Change the type of persister. It can be null if not on the browser.
  private persister: Persister | null = null; 
  private static instance: UserProfileStore;
  private listeners: Set<ProfileChangeListener> = new Set();

  private constructor() {
    console.log('Initializing UserProfileStore');
    this.store = createStore();
  }

  public static getInstance(): UserProfileStore {
    if (!UserProfileStore.instance) {
      UserProfileStore.instance = new UserProfileStore();
    }
    return UserProfileStore.instance;
  }

  // FIX: New private method to safely initialize the persister only on the client-side.
  private async getOrCreatePersister(): Promise<Persister | null> {
    // Check if we are in a browser environment.
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.persister) {
      // Dynamically import the browser-specific persister function.
      const { createLocalPersister } = await import('tinybase/persisters/persister-browser');
      this.persister = createLocalPersister(this.store, 'user-profile');
    }
    return this.persister;
  }

  public addChangeListener(listener: ProfileChangeListener) {
    this.listeners.add(listener);
  }

  public removeChangeListener(listener: ProfileChangeListener) {
    this.listeners.delete(listener);
  }

  private notifyListeners(profile: UserProfile) {
    this.listeners.forEach(listener => listener(profile));
  }

  public async initialize() {
    // Always check for browser environment before using localStorage or persister.
    if (typeof window === 'undefined') return;
    
    console.log('Loading persisted profile data...');
    
    // First try to load from localStorage
    const localStorageData = localStorage.getItem('userProfile');
    if (localStorageData) {
      try {
        const profile = JSON.parse(localStorageData);
        await this.saveProfile(profile);
        console.log('Loaded profile from localStorage:', profile);
        return;
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }

    // Fallback to TinyBase persister
    const persister = await this.getOrCreatePersister();
    if (persister) {
      await persister.load();
    }
    const profile = this.store.getRow('profiles', 'current');
    console.log('Loaded profile from TinyBase:', profile);
  }

  public async saveProfile(profile: UserProfile) {
    console.log('Saving profile:', profile);
    
    // Check for browser environment before saving.
    if (typeof window === 'undefined') {
      console.warn('Attempted to save profile on the server. Skipping.');
      return;
    }

    try {
      const storageProfile: Row = {
        ...profile,
        interests: JSON.stringify(profile.interests),
        shopping: JSON.stringify(profile.shopping)
      };
      
      this.store.setRow('profiles', 'current', storageProfile);
      
      const persister = await this.getOrCreatePersister();
      if (persister) {
        await persister.save();
      }
      
      upsertUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      this.notifyListeners(profile);
      
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }

  public getProfile(): UserProfile | null {
    console.log('Getting profile...');
    
    if (typeof window !== 'undefined') {
      const localStorageData = localStorage.getItem('userProfile');
      if (localStorageData) {
        try {
          const profile = JSON.parse(localStorageData);
          if (profile && typeof profile === 'object') {
            return profile as UserProfile;
          }
        } catch (error) {
          console.error('Error parsing localStorage profile:', error);
        }
      }
    }

    const profile = this.store.getRow('profiles', 'current');
    console.log('Raw profile from store:', profile);
    
    if (!profile || Object.keys(profile).length === 0) {
      console.log('No profile found or profile is empty');
      return null;
    }

    try {
      const userProfile = {
        sex: profile.sex as string || '',
        age: profile.age as string || '',
        shoppingFrequency: profile.shoppingFrequency as string || '',
        interests: profile.interests ? JSON.parse(profile.interests as string) : [],
        shopping: profile.shopping ? JSON.parse(profile.shopping as string) : []
      };
      console.log('Parsed profile:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error parsing profile:', error);
      return null;
    }
  }

  public async updateProfile(updates: Partial<UserProfile>) {
    console.log('UserProfileStore: Updating profile with:', updates);
    
    const currentProfile = this.getProfile() || {
      sex: '',
      age: '',
      shoppingFrequency: '',
      interests: [],
      shopping: []
    };
    
    const updatedProfile = {
      ...currentProfile,
      ...updates
    } as UserProfile; 
    
    await this.saveProfile(updatedProfile);
    console.log('UserProfileStore: Profile saved successfully');
    
    return updatedProfile;
  }

  public getStore(): Store {
    return this.store;
  }

  public async destroy() {
    const persister = await this.getOrCreatePersister();
    if (persister) {
      await persister.destroy();
    }
  }
}

export const userProfileStore = UserProfileStore.getInstance();
export default userProfileStore;

