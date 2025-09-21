// src/config/z512-codebook.ts

import { Hypervector } from '../lib/hypervectors';

/**
 * A memoization cache for generated Z512 hypervectors to avoid re-computation.
 */
const vectorCache = new Map<string, Uint16Array>();

/**
 * Manages the creation and retrieval of Z512 hypervectors.
 */
export class Z512Codebook {
  /**
   * Gets a deterministic Z512 hypervector for a given key and dimension.
   * Caches the vector for future use.
   * @param key The unique string for the concept (e.g., 'category_76').
   * @param dimension The desired dimensionality of the vector.
   * @returns A Uint16Array representing the Z512 hypervector.
   */
  public static get(key: string, dimension: number): Uint16Array {
    const cacheKey = `${key}_${dimension}`;
    if (vectorCache.has(cacheKey)) {
      return vectorCache.get(cacheKey)!;
    }

    const newVector = Hypervector.createRandomZ512(dimension, key);
    vectorCache.set(cacheKey, newVector);
    return newVector;
  }
}
