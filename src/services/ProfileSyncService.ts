// src/services/ProfileSyncService.ts

import { getUserProfileStore, UserProfile } from '../stores/UserProfileStore';
import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';
import { Codebook } from '../config/hypervector-codebook';
import { Hypervector } from '../lib/hypervectors';

const VECTOR_DIMENSION_100K = 100000;
const VECTOR_DIMENSION_10K = 10000;

/**
 * A service that synchronizes the traditional user profile with the hypervector profile.
 */
class ProfileSyncService {
  public initialize() {
    const store = getUserProfileStore();
    if (!store) {
      console.warn("UserProfileStore not available.");
      return;
    }
    store.addChangeListener(this.onProfileChange.bind(this));
    this.syncInitialProfile(store);
  }

  private async syncInitialProfile(store: ReturnType<typeof getUserProfileStore>) {
    const initialProfile = store?.getProfile();
    if (initialProfile) {
      await this.onProfileChange(initialProfile);
    }
  }

  /**
   * Handles changes to the user profile by updating the hypervector profile.
   * @param profile The new user profile data.
   */
  private async onProfileChange(profile: UserProfile) {
    const profileAttributeVectors100k: Float32Array[] = [];
    const profileAttributeVectors10k: Float32Array[] = [];

    const addAttribute = (key: string) => {
      profileAttributeVectors100k.push(Codebook.get(key, VECTOR_DIMENSION_100K));
      profileAttributeVectors10k.push(Codebook.get(key, VECTOR_DIMENSION_10K));
    };

    // Get vector for sex
    if (profile.sex) {
      addAttribute(`sex_${profile.sex.toLowerCase()}`);
    }

    // Get vector for age
    if (profile.age) {
      addAttribute(`age_${profile.age}`);
    }

    // Get vectors for all interests
    if (profile.interests && Array.isArray(profile.interests)) {
      for (const interest of profile.interests) {
        addAttribute(`interest_${interest.toLowerCase()}`);
      }
    }

    // Get vectors for all shopping preferences
    if (profile.shopping && Array.isArray(profile.shopping)) {
      for (const preference of profile.shopping) {
        addAttribute(`shopping_${preference.toLowerCase()}`);
      }
    }

    if (profileAttributeVectors100k.length === 0) {
      return; // No attributes to update
    }

    // Bundle these attributes into the main hypervector profiles
    const currentProfileVector100k = hypervectorProfileStore.getProfile();
    const updatedVector100k = Hypervector.bundle(VECTOR_DIMENSION_100K, [currentProfileVector100k, ...profileAttributeVectors100k]);

    const currentProfileVector10k = hypervectorProfileStore.getProfile10k();
    const updatedVector10k = Hypervector.bundle(VECTOR_DIMENSION_10K, [currentProfileVector10k, ...profileAttributeVectors10k]);

    await hypervectorProfileStore.syncProfiles(updatedVector100k, updatedVector10k);
    console.log('ProfileSyncService: Hypervector profiles updated with latest user profile data.');
  }
}

export const profileSyncService = new ProfileSyncService();
