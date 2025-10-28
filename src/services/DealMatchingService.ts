import { Product } from '../lib/types';
import { getDealsStore } from '../stores/KindredDealsStore';
import { compareTwoStrings } from 'string-similarity';

let dealsMap: Map<string, any[]> = new Map();

export const initializeDealMatchingService = () => {
  const dealsStore = getDealsStore();
  const deals = dealsStore.getTable('deals');
  const map = new Map<string, any[]>();
  Object.values(deals).forEach((deal: any) => {
    const merchantName = deal.merchantName;
    if (!map.has(merchantName)) {
      map.set(merchantName, []);
    }
    map.get(merchantName)?.push(deal);
  });
  dealsMap = map;
  console.log('Deal Matching Service Initialized. First 10 deals:', Array.from(dealsMap.entries()).slice(0, 10));
};

const STOP_WORDS = new Set(['a', 'the', 'for', 'and', 'of', 'on', 'in', 'with', 'off']);

const getKeywords = (text: string): string[] => {
  return text.toLowerCase().split(' ').filter(word => !STOP_WORDS.has(word) && word.length > 1);
};

export const matchDealsToProducts = (products: Product[]): Product[] => {
  if (products.length === 0 || dealsMap.size === 0) {
    return products;
  }

  return products.map(p => {
    const brand = p.name.split(' ')[0];
    const productDeals = dealsMap.get(brand) || [];
    let bestDeal = null;
    let highestScore = 0;

    if (productDeals.length > 0) {
      console.log(`Found ${productDeals.length} deals for brand: ${brand}`);
    }

    const productKeywords = getKeywords(p.name);

    // Tier 1: Score-based product-specific match
    for (const deal of productDeals) {
      try {
        const codes = JSON.parse(deal.codes as string);
        for (const code of codes) {
          if (code.summary) {
            const summaryKeywords = getKeywords(code.summary);
            let matchScore = 0;
            for (const pWord of productKeywords) {
              for (const sWord of summaryKeywords) {
                if (compareTwoStrings(pWord, sWord) > 0.8) {
                  matchScore++;
                }
              }
            }

            if (matchScore > highestScore) {
              highestScore = matchScore;
              bestDeal = code;
            }
          }
        }
      } catch (e) { console.error(e); }
    }

    // Tier 2: Store-wide match (only if no specific match was found)
    if (highestScore < 2) { // If the best match is not very specific, look for a sitewide deal
      for (const deal of productDeals) {
        try {
          const codes = JSON.parse(deal.codes as string);
          for (const code of codes) {
            if (code.summary && code.summary.toLowerCase().includes('sitewide')) {
              bestDeal = code;
              break;
            }
          }
        } catch (e) { console.error(e); }
        if (bestDeal) break;
      }
    }

    if (bestDeal) {
      console.log(`Matched deal for ${p.name}:`, bestDeal, `Score: ${highestScore}`);
    }

    return {
      ...p,
      deal: bestDeal,
    };
  });
};

