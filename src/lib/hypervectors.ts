// src/lib/hypervectors.ts

import { blake3Hash } from '@webbuf/blake3';
import { WebBuf } from 'webbuf';

/**
 * A class for creating and manipulating high-dimensional vectors (hypervectors).
 * This implementation is based on the principles of Hyperdimensional Computing /
 * Vector-Symbolic Architectures (HDC/VSA).
 */
export class Hypervector {
  /**
   * Creates a new, deterministic bipolar hypervector (+1.0 / -1.0) using a BLAKE3 hash of a seed.
   * @param dimension The desired dimensionality of the vector.
   * @param seed A unique string for the concept (e.g., 'product_click').
   * @returns A new Float32Array representing the raw bipolar hypervector.
   */
  public static createRandom(dimension: number, seed: string): Float32Array {
    const vector = new Float32Array(dimension);
    const requiredBytes = Math.ceil(dimension / 8);
    let generatedBytes = new Uint8Array(0);
    let counter = 0;

    while (generatedBytes.length < requiredBytes) {
      const seedWithCounter = `${seed}:${counter}`;
      const data = new WebBuf(new TextEncoder().encode(seedWithCounter));
      const hash = blake3Hash(data);
      
      const newBytes = new Uint8Array(generatedBytes.length + hash.buf.length);
      newBytes.set(generatedBytes);
      newBytes.set(hash.buf, generatedBytes.length);
      generatedBytes = newBytes;
      
      counter++;
    }

    let bitIndex = 0;
    for (let i = 0; i < dimension; i++) {
      const byteIndex = Math.floor(bitIndex / 8);
      const bitInByteIndex = bitIndex % 8;
      const byte = generatedBytes[byteIndex];
      const bit = (byte >> bitInByteIndex) & 1;
      vector[i] = bit === 1 ? 1.0 : -1.0;
      bitIndex++;
    }
    return vector;
  }

  /**
   * Combines multiple hypervectors into a single summary vector using element-wise addition.
   * This is the "bundling" operation. The resulting vector is NOT normalized.
   * @param dimension The dimensionality of the vectors.
   * @param vectors An array of hypervectors to bundle.
   * @returns A new, raw hypervector that represents the bundled information.
   */
  public static bundle(dimension: number, vectors: Float32Array[]): Float32Array {
    if (vectors.length === 0) {
      return new Float32Array(dimension);
    }

    const sumVector = new Float32Array(dimension);
    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        sumVector[i] += vector[i];
      }
    }
    return sumVector;
  }

  /**
   * Normalizes a hypervector to have a unit length (magnitude of 1).
   * This is typically done just before a similarity search.
   * @param dimension The dimensionality of the vector.
   * @param vector The hypervector to normalize.
   * @returns A new, normalized hypervector.
   */
  public static normalize(dimension: number, vector: Float32Array): Float32Array {
    const normalizedVector = new Float32Array(vector);
    const norm = Math.sqrt(normalizedVector.reduce((acc, val) => acc + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < dimension; i++) {
        normalizedVector[i] /= norm;
      }
    }
    return normalizedVector;
  }

  /**
   * Binds two hypervectors together to create a new vector that represents the association.
   * This implementation uses element-wise multiplication.
   * @param dimension The dimensionality of the vectors.
   * @param vectorA The first hypervector.
   * @param vectorB The second hypervector.
   * @returns A new hypervector representing the bound pair.
   */
  public static bind(dimension: number, vectorA: Float32Array, vectorB: Float32Array): Float32Array {
    const result = new Float32Array(dimension);
    for (let i = 0; i < dimension; i++) {
      result[i] = vectorA[i] * vectorB[i];
    }
    return result;
  }

  /**
   * Calculates the cosine similarity between two hypervectors.
   * For best results, the vectors should be normalized first.
   * @param dimension The dimensionality of the vectors.
   * @param vectorA The first hypervector.
   * @param vectorB The second hypervector.
   * @returns A number between -1 and 1, where 1 is most similar.
   */
  public static similarity(dimension: number, vectorA: Float32Array, vectorB: Float32Array): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < dimension; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  // --- Z32 FINITE GROUP VSA FUNCTIONS ---

  /**
   * Creates a new, deterministic Z32 hypervector {0..31} using a BLAKE3 hash of a seed.
   * This is a client-side adaptation of the ultimate Z32 generator.
   * @param dimension The desired dimensionality of the vector.
   * @param seed A unique string for the concept.
   * @returns A new Uint8Array representing the Z32 hypervector.
   */
  public static createRandomZ32(dimension: number, seed: string): Uint8Array {
    const hv = new Uint8Array(dimension);
    let currentHash: Uint8Array;
    let byteIndex = 0;
    let bitIndex = 0;

    // Initial hash
    const data = new WebBuf(new TextEncoder().encode(seed));
    currentHash = blake3Hash(data).buf;

    for (let i = 0; i < dimension; i++) {
      let value = 0;
      for (let b = 0; b < 5; b++) { // Collect 5 bits for a value from 0-31
        if (byteIndex >= currentHash.length) {
          // Re-hash the previous hash to get a new stream of bytes
          const rehashData = new WebBuf(currentHash);
          currentHash = blake3Hash(rehashData).buf;
          byteIndex = 0;
        }
        const bit = (currentHash[byteIndex] >> bitIndex) & 1;
        value |= (bit << b);
        bitIndex++;
        if (bitIndex >= 8) {
          byteIndex++;
          bitIndex = 0;
        }
      }
      hv[i] = value;
    }
    return hv;
  }

  /**
   * Binds two Z32 hypervectors together using element-wise modular addition.
   * @param a The first Z32 hypervector.
   * @param b The second Z32 hypervector.
   * @returns A new Z32 hypervector representing the bound pair.
   */
  public static bindZ32(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = (a[i] + b[i]) % 32;
    }
    return result;
  }

  /**
   * Bundles multiple Z32 hypervectors into a single summary vector.
   * Uses a larger typed array to prevent overflow before the final modulo.
   * @param vectors An array of Z32 hypervectors to bundle.
   * @returns A new Z32 hypervector that represents the bundled information.
   */
  public static bundleZ32(vectors: Uint8Array[]): Uint8Array {
    if (vectors.length === 0) {
      return new Uint8Array(0);
    }
    const dim = vectors[0].length;
    const accumulator = new Uint32Array(dim);

    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) {
        accumulator[i] += vec[i];
      }
    }

    const result = new Uint8Array(dim);
    for (let i = 0; i < dim; i++) {
      result[i] = accumulator[i] % 32;
    }
    return result;
  }

  /**
   * Permutes a Z32 hypervector by performing a circular shift.
   * @param v The Z32 hypervector to permute.
   * @param shift The number of positions to shift. Can be negative.
   * @returns A new, permuted Z32 hypervector.
   */
  public static permuteZ32(v: Uint8Array, shift = 1): Uint8Array {
    const n = v.length;
    const permuted = new Uint8Array(n);
    const netShift = ((shift % n) + n) % n;
    for (let i = 0; i < n; i++) {
      permuted[(i + netShift) % n] = v[i];
    }
    return permuted;
  }

  // --- Z512 FINITE GROUP VSA FUNCTIONS ---

  /**
   * Creates a new, deterministic Z512 hypervector {0..511} using a BLAKE3 hash of a seed.
   * @param dimension The desired dimensionality of the vector.
   * @param seed A unique string for the concept.
   * @returns A new Uint16Array representing the Z512 hypervector.
   */
  public static createRandomZ512(dimension: number, seed: string): Uint16Array {
    const hv = new Uint16Array(dimension);
    let currentHash: Uint8Array;
    let byteIndex = 0;
    let bitIndex = 0;

    // Initial hash
    const data = new WebBuf(new TextEncoder().encode(seed));
    currentHash = blake3Hash(data).buf;

    for (let i = 0; i < dimension; i++) {
      let value = 0;
      for (let b = 0; b < 9; b++) { // Collect 9 bits for a value from 0-511
        if (byteIndex >= currentHash.length) {
          // Re-hash the previous hash to get a new stream of bytes
          const rehashData = new WebBuf(currentHash);
          currentHash = blake3Hash(rehashData).buf;
          byteIndex = 0;
        }
        const bit = (currentHash[byteIndex] >> bitIndex) & 1;
        value |= (bit << b);
        bitIndex++;
        if (bitIndex >= 8) {
          byteIndex++;
          bitIndex = 0;
        }
      }
      hv[i] = value;
    }
    return hv;
  }

  /**
   * Binds two Z512 hypervectors together using element-wise modular addition.
   * @param a The first Z512 hypervector.
   * @param b The second Z512 hypervector.
   * @returns A new Z512 hypervector representing the bound pair.
   */
  public static bindZ512(a: Uint16Array, b: Uint16Array): Uint16Array {
    const result = new Uint16Array(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = (a[i] + b[i]) % 512;
    }
    return result;
  }

  /**
   * Bundles multiple Z512 hypervectors into a single summary vector.
   * Uses a larger typed array to prevent overflow before the final modulo.
   * @param vectors An array of Z512 hypervectors to bundle.
   * @returns A new Z512 hypervector that represents the bundled information.
   */
  public static bundleZ512(vectors: Uint16Array[]): Uint16Array {
    if (vectors.length === 0) {
      return new Uint16Array(0);
    }
    const dim = vectors[0].length;
    const accumulator = new Uint32Array(dim);

    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) {
        accumulator[i] += vec[i];
      }
    }

    const result = new Uint16Array(dim);
    for (let i = 0; i < dim; i++) {
      result[i] = accumulator[i] % 512;
    }
    return result;
  }

  /**
   * Permutes a Z512 hypervector by performing a circular shift.
   * @param v The Z512 hypervector to permute.
   * @param shift The number of positions to shift. Can be negative.
   * @returns A new, permuted Z512 hypervector.
   */
  public static permuteZ512(v: Uint16Array, shift = 1): Uint16Array {
    const n = v.length;
    const permuted = new Uint16Array(n);
    const netShift = ((shift % n) + n) % n;
    for (let i = 0; i < n; i++) {
      permuted[(i + netShift) % n] = v[i];
    }
    return permuted;
  }
}
