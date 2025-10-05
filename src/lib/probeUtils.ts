import { Hypervector } from './hypervectors';

const VECTOR_DIMENSION = 100000;
let cachedCatalogVector: Float32Array | null = null;

/**
 * Calculates a holocron coordinate for a given data object.
 * The coordinate is determined by the similarity between the data's hypervector
 * and a cached catalog vector.
 * @param data The data to be converted into a coordinate.
 * @returns A promise that resolves to a numerical coordinate.
 */
export async function getCoordinateForData(data: any): Promise<number> {
  if (!cachedCatalogVector) {
    const vectorResponse = await fetch('/catalog_vector_layer2.bin');
    const buffer = await vectorResponse.arrayBuffer();
    cachedCatalogVector = new Float32Array(new Int8Array(buffer));
  }
  
  // Convert data to a lowercase string before creating the vector
  const dataString = JSON.stringify(data).toLowerCase();
  const dataVector = Hypervector.createRandom(VECTOR_DIMENSION, dataString);
  
  return Hypervector.similarity(VECTOR_DIMENSION, dataVector, cachedCatalogVector);
}
