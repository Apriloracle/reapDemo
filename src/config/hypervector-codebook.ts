// src/config/hypervector-codebook.ts

import { Hypervector } from '../lib/hypervectors';

/**
 * A class that manages the "codebook" for our VSA system.
 * It maps symbolic concepts to their high-dimensional vector representations.
 * This version is stateless and generates deterministic vectors on the fly.
 */
export class Codebook {
  private static codebook = new Map<string, Float32Array>();

  /**
   * Gets the hypervector for a given key and dimension.
   * If the key has not been seen for the given dimension in the current session,
   * a new deterministic hypervector is created and cached in memory.
   * @param key The key representing the concept (e.g., 'product_click').
   * @param dimension The desired dimensionality of the vector.
   * @returns The hypervector for the given key and dimension.
   */
  public static get(key: string, dimension: number): Float32Array {
    const cacheKey = `${key}_${dimension}`;
    if (!this.codebook.has(cacheKey)) {
      // The vector is generated deterministically from the key itself.
      this.codebook.set(cacheKey, Hypervector.createRandom(dimension, key));
    }
    return this.codebook.get(cacheKey)!;
  }
}
