import { createStore, Store, Row } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { addCoordinateToStore } from '../lib/storeCoordinates';

// Base interface for type safety when working with profiles
interface BaseUserProfile {
  sex: string;
  age: string;
  shoppingFrequency: string;
  interests: string[];
  shopping: string[];
  personality?: Record<string, number>; // <-- ✅ Added personality
}

// Extended interface with index signature for TinyBase compatibility
export interface UserProfile extends BaseUserProfile {
  [key: string]: string | string[] | Record<string, number> | undefined; // <-- ✅ personality-compatible
}

type ProfileChangeListener = (profile: UserProfile) => void;

class UserProfileStore {
  private store: Store;
  private persister: any;
  private static instance: UserProfileStore;
  private listeners: Set<ProfileChangeListener> = new Set();

  private constructor() {
    console.log('Initializing UserProfileStore');
    this.store = createStore();
    if (typeof window !== 'undefined') {
      this.persister = createLocalPersister(this.store, 'user-profile');
    }
  }

  public static getInstance(): UserProfileStore {
    if (!UserProfileStore.instance) {
      UserProfileStore.instance = new UserProfileStore();
    }
    return UserProfileStore.instance;
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

    await this.persister.load();
    const profile = this.store.getRow('profiles', 'current');
    console.log('Loaded profile from TinyBase:', profile);
  }

  public async saveProfile(profile: UserProfile) {
    console.log('Saving profile:', profile);
    try {
      // Convert arrays and nested objects to strings for storage
      const storageProfile: Row = {
        ...profile,
        interests: JSON.stringify(profile.interests),
        shopping: JSON.stringify(profile.shopping),
        personality: JSON.stringify(profile.personality || {}) // <-- ✅ New personality support
      };
      console.log('Converted profile for storage:', storageProfile);

      this.store.setRow('profiles', 'current', storageProfile);

      const updateCoordinates = addCoordinateToStore(this.store, 'profiles');
      await updateCoordinates();
      await this.persister.save();

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
        shopping: profile.shopping ? JSON.parse(profile.shopping as string) : [],
        personality: profile.personality
          ? JSON.parse(profile.personality as string)
          : {} // <-- ✅ Parse stored personality object
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
      shopping: [],
      personality: {} // <-- ✅ Ensure default personality
    };
    
    console.log('UserProfileStore: Current profile before update:', currentProfile);
    
    const updatedProfile = {
      ...currentProfile,
      ...updates
    } as UserProfile;
    
    console.log('UserProfileStore: Profile after merge:', updatedProfile);
    
    await this.saveProfile(updatedProfile);
    console.log('UserProfileStore: Profile saved successfully');
    
    return updatedProfile;
  }

  public getStore(): Store {
    return this.store;
  }

  public async destroy() {
    await this.persister.destroy();
  }
}

export const userProfileStore = UserProfileStore.getInstance();
export default userProfileStore;
