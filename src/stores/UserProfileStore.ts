import { createStore, Store, Row } from 'tinybase';
import type { LocalPersister } from 'tinybase/persisters/persister-browser';
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
  private persister: LocalPersister | null = null;
  private static instance: UserProfileStore | null = null;
  private listeners: Set<ProfileChangeListener> = new Set();

  private constructor() {
    console.log('Initializing UserProfileStore');
    this.store = createStore();
  }

  public static getInstance(): UserProfileStore | null {
    // Only create instance in browser
    if (typeof window === 'undefined') {
      console.log('UserProfileStore: Skipping getInstance on server');
      return null;
    }

    if (!UserProfileStore.instance) {
      UserProfileStore.instance = new UserProfileStore();
      // Initialize asynchronously
      UserProfileStore.instance.initialize().catch(error => {
        console.error('Error during UserProfileStore initialization:', error);
      });
    }
    return UserProfileStore.instance;
  }

  private async getOrCreatePersister(): Promise<LocalPersister | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.persister) {
      try {
        const { createLocalPersister } = await import('tinybase/persisters/persister-browser');
        this.persister = createLocalPersister(this.store, 'user-profile');
      } catch (error) {
        console.error('Error creating persister:', error);
        return null;
      }
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
    if (typeof window === 'undefined') {
      console.log('Skipping UserProfileStore initialization on server');
      return;
    }
    
    console.log('Loading persisted profile data...');
    
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

    const persister = await this.getOrCreatePersister();
    if (persister) {
      try {
        await persister.load();
        const profile = this.store.getRow('profiles', 'current');
        console.log('Loaded profile from TinyBase:', profile);
      } catch (error) {
        console.error('Error loading from persister:', error);
      }
    }
  }

  public async saveProfile(profile: UserProfile) {
    console.log('Saving profile:', profile);
    
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
      
      await upsertUserProfile();
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

// Helper function to safely get the instance
export function getUserProfileStore(): UserProfileStore | null {
  return UserProfileStore.getInstance();
}

// Don't create instance at module level - let components call getUserProfileStore() when needed
export default getUserProfileStore;
