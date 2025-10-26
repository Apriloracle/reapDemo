interface Product {
  asin: string;
  price: number;
  rating: number;
  [key: string]: any;
}

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

  const prices = products.map(p => p.price);
  const ratings = products.map(p => p.rating);

  const scores = new Map<string, number>();

  products.forEach(product => {
    // For price, a lower value is better, so we want the percentile of being CHEAPER than others.
    // The rank formula naturally handles this: a low price will have a low percentile.
    // To make a higher score better, we subtract from 1.
    const pricePercentile = 1 - calculatePercentileRank(prices, product.price);
    
    // Higher percentile is better for rating (higher rating = higher rank)
    const ratingPercentile = calculatePercentileRank(ratings, product.rating);

    // Calculate geometric mean
    const valueScore = Math.sqrt(pricePercentile * ratingPercentile);
    
    scores.set(product.asin, valueScore);
  });

  return scores;
};
