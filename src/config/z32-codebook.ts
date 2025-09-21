// src/config/z32-codebook.ts

import { Hypervector } from '../lib/hypervectors';

/**
 * A memoization cache for generated Z32 hypervectors to avoid re-computation.
 */
const vectorCache = new Map<string, Uint8Array>();

/**
 * Manages the creation and retrieval of Z32 hypervectors.
 * This is the Z32 equivalent of the original Codebook.
 */
export class Z32Codebook {
  /**
   * Gets a deterministic Z32 hypervector for a given key and dimension.
   * Caches the vector for future use.
   * @param key The unique string for the concept (e.g., 'category_76').
   * @param dimension The desired dimensionality of the vector.
   * @returns A Uint8Array representing the Z32 hypervector.
   */
  public static get(key: string, dimension: number): Uint8Array {
    const cacheKey = `${key}_${dimension}`;
    if (vectorCache.has(cacheKey)) {
      return vectorCache.get(cacheKey)!;
    }

    const newVector = Hypervector.createRandomZ32(dimension, key);
    vectorCache.set(cacheKey, newVector);
    return newVector;
  }
}
