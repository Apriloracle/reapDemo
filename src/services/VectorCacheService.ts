// src/services/VectorCacheService.ts

import { get, set } from '../lib/indexedDbHelper';

const VECTOR_API_ENDPOINT = 'http://35.224.41.251:3535/vector/';
const DB_KEY_PREFIX = 'vector-cache-';

class VectorCacheService {
  private inMemoryCache = new Map<string, Float32Array>();

  /**
   * Gets the 10k hypervector for a given product ASIN.
   * It checks an in-memory cache, then IndexedDB, and finally fetches from the API.
   * @param asin The ASIN of the product.
   * @returns The hypervector as a Float32Array, or null if not found.
   */
  public async getVector(asin: string): Promise<Float32Array | null> {
    // 1. Check in-memory cache
    if (this.inMemoryCache.has(asin)) {
      return this.inMemoryCache.get(asin)!;
    }

    // 2. Check IndexedDB cache
    const dbKey = `${DB_KEY_PREFIX}${asin}`;
    const cachedVector = await get<Float32Array>(dbKey);
    if (cachedVector) {
      this.inMemoryCache.set(asin, cachedVector); // Populate in-memory cache
      return cachedVector;
    }

    // 3. Fetch from API
    try {
      console.log(`VectorCacheService: Fetching vector for ASIN: ${asin}`);
      const response = await fetch(`${VECTOR_API_ENDPOINT}${asin}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();

      // Assuming the API returns a JSON object with a 'simple_vector' property
      const vectorAsArray = data.simple_vector;
      if (!vectorAsArray || !Array.isArray(vectorAsArray)) {
        throw new Error('Invalid vector format in API response.');
      }

      const vector = new Float32Array(vectorAsArray);

      // Store in caches
      this.inMemoryCache.set(asin, vector);
      await set(dbKey, vector);

      return vector;
    } catch (error) {
      console.error(`VectorCacheService: Failed to fetch vector for ASIN ${asin}:`, error);
      return null;
    }
  }
}

export const vectorCacheService = new VectorCacheService();
