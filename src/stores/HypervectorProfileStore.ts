// src/stores/HypervectorProfileStore.ts

import { get, set } from '../lib/indexedDbHelper';
import { Hypervector } from '../lib/hypervectors';
import { Codebook } from '../config/hypervector-codebook';
import { Z32Codebook } from '../config/z32-codebook';
import { Z512Codebook } from '../config/z512-codebook';

const VECTOR_DIMENSION_100K = 100000;
const VECTOR_DIMENSION_10K = 10000;
const PROFILE_DB_KEY_100K = 'user-profile-hypervector-100k';
const PROFILE_DB_KEY_10K = 'user-profile-hypervector-10k';

/**
 * Manages the user's profile hypervectors (both 100k and 10k),
 * using a native IndexedDB implementation for persistence.
 */
export class HypervectorProfileStore {
  private profile100k: Float32Array;
  private profile10k: Float32Array;
  private static instance: HypervectorProfileStore;

  private constructor() {
    this.profile100k = new Float32Array(VECTOR_DIMENSION_100K);
    this.profile10k = new Float32Array(VECTOR_DIMENSION_10K);
  }

  public static getInstance(): HypervectorProfileStore {
    if (!HypervectorProfileStore.instance) {
      HypervectorProfileStore.instance = new HypervectorProfileStore();
    }
    return HypervectorProfileStore.instance;
  }

  /**
   * Initializes the store by loading both profiles from IndexedDB.
   * If a profile is not found, it creates and saves a new zero vector for that dimension.
   */
  public async initialize(): Promise<void> {
    console.log('HypervectorProfileStore: Initializing with native IndexedDB...');
    
    const [loadedProfile100k, loadedProfile10k] = await Promise.all([
      get<Float32Array>(PROFILE_DB_KEY_100K),
      get<Float32Array>(PROFILE_DB_KEY_10K)
    ]);

    if (loadedProfile100k) {
      this.profile100k = loadedProfile100k;
      console.log('HypervectorProfileStore: Loaded 100k profile from IndexedDB.');
    } else {
      console.log('HypervectorProfileStore: No 100k profile found. Creating a new one.');
    }

    if (loadedProfile10k) {
      this.profile10k = loadedProfile10k;
      console.log('HypervectorProfileStore: Loaded 10k profile from IndexedDB.');
    } else {
      console.log('HypervectorProfileStore: No 10k profile found. Creating a new one.');
    }
    
    // Save profiles to ensure they exist in DB if they were just created
    await this.saveProfiles();
  }

  /**
   * Gets the current 100k user profile hypervector.
   * @returns The user's 100k profile as a Float32Array.
   */
  public getProfile(): Float32Array {
    return this.profile100k;
  }

  /**
   * Gets the current 10k user profile hypervector.
   * @returns The user's 10k profile as a Float32Array.
   */
  public getProfile10k(): Float32Array {
    return this.profile10k;
  }

  /**
   * Gets the current 10k user profile hypervector, normalized and formatted for the API.
   * @returns The user's 10k profile as an Int32Array, ready to be sent to the backend.
   */
  public getProfile10kForApi(): Int32Array {
    const normalizedProfile = Hypervector.normalize(VECTOR_DIMENSION_10K, this.profile10k);
    return new Int32Array(normalizedProfile.map(v => Math.round(v * 1000)));
  }

  /**
   * Adds a new interaction to both user profiles using client-side generated vectors.
   * @param interactionKey The key for the interaction type.
   * @param itemKey The key for the item being interacted with.
   */
  public async addInteraction(interactionKey: string, itemKey: string): Promise<void> {
    // Update 100k profile
    const interactionVector100k = Codebook.get(interactionKey, VECTOR_DIMENSION_100K);
    const itemVector100k = Codebook.get(itemKey, VECTOR_DIMENSION_100K);
    const contextualizedVector100k = Hypervector.bind(VECTOR_DIMENSION_100K, interactionVector100k, itemVector100k);
    this.profile100k = Hypervector.bundle(VECTOR_DIMENSION_100K, [this.profile100k, contextualizedVector100k]);

    // Update 10k profile
    const interactionVector10k = Codebook.get(interactionKey, VECTOR_DIMENSION_10K);
    const itemVector10k = Codebook.get(itemKey, VECTOR_DIMENSION_10K);
    const contextualizedVector10k = Hypervector.bind(VECTOR_DIMENSION_10K, interactionVector10k, itemVector10k);
    this.profile10k = Hypervector.bundle(VECTOR_DIMENSION_10K, [this.profile10k, contextualizedVector10k]);

    await this.saveProfiles();
  }

  /**
   * Adds a new Z32 interaction to the 100k user profile.
   * This creates a structured "fact" vector using the Z32 VSA model.
   * @param parts - An object containing the parts of the fact (e.g., { user: 'user_123', action: 'search', object: 'query' }).
   */
  public async addZ32Interaction(parts: { [role: string]: string }): Promise<void> {
    const factComponents = Object.entries(parts).map(([role, key], index) => {
      const baseVector = Z32Codebook.get(key, VECTOR_DIMENSION_100K);
      // Permute the vector to assign its role in the fact
      return Hypervector.permuteZ32(baseVector, index + 1);
    });

    if (factComponents.length > 1) {
      const factVector = factComponents.reduce((acc, vec) => Hypervector.bindZ32(acc, vec));
      // Note: We need a way to bundle a Z32 vector (Uint8Array) into a Float32Array profile.
      // For now, we'll convert and add. This might need a more sophisticated approach later.
      const convertedFactVector = new Float32Array(factVector);
      this.profile100k = Hypervector.bundle(VECTOR_DIMENSION_100K, [this.profile100k, convertedFactVector]);
      await this.saveProfiles();
      console.log('HypervectorProfileStore: Added Z32 interaction to 100k profile.');
    }
  }

  /**
   * Adds a new Z512 interaction to both the 100k and 10k user profiles.
   * This creates a structured "fact" vector using the Z512 VSA model.
   * @param parts - An object containing the parts of the fact (e.g., { attribute: 'category_selected', value: 'category_76' }).
   * @param dimension - The dimension of the vector to add to the profile (e.g., 10000 for the 10k profile).
   */
  public async addZ512Interaction(parts: { [role: string]: string }, dimension: number): Promise<void> {
    const factComponents = Object.entries(parts).map(([role, key], index) => {
      const baseVector = Z512Codebook.get(key, dimension);
      // Permute the vector to assign its role in the fact
      return Hypervector.permuteZ512(baseVector, index + 1);
    });
  
    if (factComponents.length > 1) {
      const factVector = factComponents.reduce((acc, vec) => Hypervector.bindZ512(acc, vec));
      
      // Convert Z512 vector (Uint16Array) to a Float32Array for bundling
      const convertedFactVector = new Float32Array(factVector);
  
      // Update the appropriate profile based on the dimension
      if (dimension === VECTOR_DIMENSION_100K) {
        this.profile100k = Hypervector.bundle(VECTOR_DIMENSION_100K, [this.profile100k, convertedFactVector]);
        console.log('HypervectorProfileStore: Added Z512 interaction to 100k profile.');
      } else if (dimension === VECTOR_DIMENSION_10K) {
        this.profile10k = Hypervector.bundle(VECTOR_DIMENSION_10K, [this.profile10k, convertedFactVector]);
        console.log('HypervectorProfileStore: Added Z512 interaction to 10k profile.');
      }
  
      await this.saveProfiles();
    }
  }

  /**
   * Adds device context to both user profiles.
   * @param deviceData A key-value object of device properties.
   */
  public async addDeviceContext(deviceData: { [key: string]: string | number | boolean }): Promise<void> {
    // Update 100k profile
    const deviceVectors100k = Object.entries(deviceData).map(([key, value]) => {
      const keyVector = Codebook.get(key, VECTOR_DIMENSION_100K);
      const valueVector = Codebook.get(String(value), VECTOR_DIMENSION_100K);
      return Hypervector.bind(VECTOR_DIMENSION_100K, keyVector, valueVector);
    });
    const bundledDeviceVector100k = Hypervector.bundle(VECTOR_DIMENSION_100K, deviceVectors100k);
    this.profile100k = Hypervector.bundle(VECTOR_DIMENSION_100K, [this.profile100k, bundledDeviceVector100k]);

    // Update 10k profile
    const deviceVectors10k = Object.entries(deviceData).map(([key, value]) => {
      const keyVector = Codebook.get(key, VECTOR_DIMENSION_10K);
      const valueVector = Codebook.get(String(value), VECTOR_DIMENSION_10K);
      return Hypervector.bind(VECTOR_DIMENSION_10K, keyVector, valueVector);
    });
    const bundledDeviceVector10k = Hypervector.bundle(VECTOR_DIMENSION_10K, deviceVectors10k);
    this.profile10k = Hypervector.bundle(VECTOR_DIMENSION_10K, [this.profile10k, bundledDeviceVector10k]);

    await this.saveProfiles();
  }

  /**
   * Adds a cluster of items to the 100k user profile.
   * @param itemKeys An array of keys for the items in the cluster.
   */
  public async addClusterToProfile(itemKeys: string[]): Promise<void> {
    if (itemKeys.length === 0) return;

    const itemVectors100k = itemKeys.map(key => Codebook.get(key, VECTOR_DIMENSION_100K));
    const clusterConceptVector100k = Hypervector.bundle(VECTOR_DIMENSION_100K, itemVectors100k);
    const interactionVector100k = Codebook.get('clustered_interaction', VECTOR_DIMENSION_100K);
    const contextualizedVector100k = Hypervector.bind(VECTOR_DIMENSION_100K, interactionVector100k, clusterConceptVector100k);
    this.profile100k = Hypervector.bundle(VECTOR_DIMENSION_100K, [this.profile100k, contextualizedVector100k]);
    
    await this.saveProfiles();
    console.log(`HypervectorProfileStore: Added a cluster of ${itemKeys.length} items to the 100k profile.`);
  }

  /**
   * Adds a real, pre-computed product vector to the 10k user profile.
   * @param productVector The real 10k vector for the product.
   */
  public async addRealProductVector(productVector: Float32Array): Promise<void> {
    if (productVector.length !== VECTOR_DIMENSION_10K) {
      console.error('Invalid vector dimension provided to addRealProductVector.');
      return;
    }
    this.profile10k = Hypervector.bundle(VECTOR_DIMENSION_10K, [this.profile10k, productVector]);
    await this.saveProfiles();
    console.log('HypervectorProfileStore: Added real product vector to 10k profile.');
  }

  /**
   * Synchronizes the profiles with new hypervectors and saves them.
   * @param profile100k The new 100k hypervector.
   * @param profile10k The new 10k hypervector.
   */
  public async syncProfiles(profile100k: Float32Array, profile10k: Float32Array): Promise<void> {
    this.profile100k = profile100k;
    this.profile10k = profile10k;
    await this.saveProfiles();
  }

  /**
   * Saves both profile hypervectors to IndexedDB.
   */
  private async saveProfiles(): Promise<void> {
    console.log('HypervectorProfileStore: Saving profiles to IndexedDB...');
    await Promise.all([
      set(PROFILE_DB_KEY_100K, this.profile100k),
      set(PROFILE_DB_KEY_10K, this.profile10k)
    ]);
    console.log('HypervectorProfileStore: Profiles saved to IndexedDB.');
  }
}

export const hypervectorProfileStore = HypervectorProfileStore.getInstance();
