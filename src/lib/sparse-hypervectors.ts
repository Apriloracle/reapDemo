// src/lib/sparse-hypervectors.ts

/**
 * Represents a sparse hypervector using a plain object for simplicity.
 * The key is the dimension index (string), and the value is the non-zero value at that dimension.
 */
export type SparseHypervector = { [key: string]: number };

const MODULUS = 16384; // 14-bit precision (0-16383)

/**
 * A helper function to perform SHA-256 hashing in the browser.
 * @param data - The data to hash.
 * @returns A Promise that resolves to the hash as a Uint8Array.
 */
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return new Uint8Array(hashBuffer);
}

/**
 * Generates a sparse Z16384 hypervector.
 * @param id - A unique string or number to seed the vector generation.
 * @param dim - The total dimensionality of the vector space.
 * @param sparsity - The number of non-zero elements the vector should have.
 * @returns A Promise that resolves to a plain object representing the sparse hypervector.
 */
export async function generateSparseHV(id: string | number, dim: number, sparsity = 3): Promise<SparseHypervector> {
  const hv: SparseHypervector = {};
  const encoder = new TextEncoder();
  const seed = await sha256(encoder.encode(String(id)));

  for (let i = 0; i < sparsity; i++) {
    // Deterministically pick a dimension index
    const indexSeed = new Uint8Array(seed.length + 1);
    indexSeed.set(seed);
    indexSeed.set([i], seed.length);
    const indexHash = await sha256(indexSeed);
    const index = new DataView(indexHash.buffer).getUint32(0, false) % dim;

    // Deterministically pick a value
    const valueSeed = new Uint8Array(seed.length + 2);
    valueSeed.set(seed);
    valueSeed.set([i, i], seed.length);
    const valueHash = await sha256(valueSeed);
    const value = new DataView(valueHash.buffer).getUint16(0, false) % MODULUS;

    hv[index] = value;
  }
  return hv;
}

/**
 * Bundles (adds) two sparse vectors together using modular arithmetic.
 * @param a - The first sparse hypervector.
 * @param b - The second sparse hypervector.
 * @returns A new object representing the bundled sparse hypervector.
 */
export function add_sparse(a: SparseHypervector, b: SparseHypervector): SparseHypervector {
  const result = { ...a };
  for (const key in b) {
    if (b.hasOwnProperty(key)) {
      const existingValue = result[key] || 0;
      result[key] = (existingValue + b[key]) % MODULUS;
    }
  }
  return result;
}

/**
 * Calculates the dot product similarity between two sparse hypervectors.
 * @param query - The query sparse hypervector.
 * @param document - The document sparse hypervector.
 * @returns A similarity score.
 */
export function similarity_sparse(query: SparseHypervector, document: SparseHypervector): number {
  if (!query || !document) {
    return 0;
  }

  let dotProduct = 0;
  const queryKeys = Object.keys(query);
  const docKeys = Object.keys(document);

  // Iterate over the smaller object for efficiency
  const [smaller, larger] = queryKeys.length < docKeys.length ? [query, document] : [document, query];
  const smallerKeys = Object.keys(smaller);
  
  for (const key of smallerKeys) {
    if (larger.hasOwnProperty(key)) {
      dotProduct += smaller[key] * larger[key];
    }
  }
  
  return dotProduct;
}
