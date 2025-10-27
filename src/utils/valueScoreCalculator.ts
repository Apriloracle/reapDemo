import { Product } from '../lib/types';

/**
 * Calculates the percentile rank of a value in an array, handling ties correctly.
 * @param array The array of numbers (does not need to be pre-sorted).
 * @param value The value to rank.
 * @returns The percentile rank (0 to 1).
 */
const calculatePercentileRank = (array: number[], value: number): number => {
  if (array.length === 0) {
    return 0;
  }
  
  let less = 0;
  let equal = 0;

  for (const v of array) {
    if (v < value) {
      less++;
    } else if (v === value) {
      equal++;
    }
  }

  if (equal === 0) {
    // If the value is not in the array, we can find its position in a sorted list
    const sorted = [...array].sort((a, b) => a - b);
    let i = 0;
    while (i < sorted.length && sorted[i] < value) {
      i++;
    }
    return i / sorted.length;
  }

  return (less + 0.5 * equal) / array.length;
};

/**
 * Calculates a "Value Score" for each product based on its price and rating percentiles.
 * @param products An array of product objects.
 * @returns A Map where keys are product ASINs and values are their value scores.
 */
export const calculateValueScores = (products: Product[]): Map<string, number> => {
  if (!products || products.length === 0) {
    return new Map();
  }

  // Filter out products that don't have a price, rating, or enough ratings to be considered reliable.
  const scorableProducts = products.filter(p => 
    typeof p.price === 'number' && 
    typeof p.rating === 'number' &&
    (p.ratingCount || 0) >= 20
  );

  if (scorableProducts.length === 0) {
    return new Map();
  }

  const prices = scorableProducts.map(p => p.price as number);
  const ratings = scorableProducts.map(p => p.rating as number);

  const scores = new Map<string, number>();

  scorableProducts.forEach(product => {
    // For price, a lower value is better, so we want the percentile of being CHEAPER than others.
    // The rank formula naturally handles this: a low price will have a low percentile.
    // To make a higher score better, we subtract from 1.
    const pricePercentile = 1 - calculatePercentileRank(prices, product.price as number);
    
    // Higher percentile is better for rating (higher rating = higher rank)
    const ratingPercentile = calculatePercentileRank(ratings, product.rating as number);

    // Calculate geometric mean
    const valueScore = Math.sqrt(pricePercentile * ratingPercentile);
    
    scores.set(product.asin, valueScore);
  });

  return scores;
};
