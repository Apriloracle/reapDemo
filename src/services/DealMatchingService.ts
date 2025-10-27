import { Product } from '../lib/types';
import { getDealsStore } from '../stores/KindredDealsStore';

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
  // Log the first 10 entries of the deals map to verify the data
  console.log('Deal Matching Service Initialized. First 10 deals:', Array.from(dealsMap.entries()).slice(0, 10));
};

export const matchDealsToProducts = (products: Product[]): Product[] => {
  if (products.length === 0 || dealsMap.size === 0) {
    return products;
  }

  return products.map(p => {
    const brand = p.name.split(' ')[0];
    const productDeals = dealsMap.get(brand) || [];
    let bestDeal = null;

    if (productDeals.length > 0) {
      console.log(`Found ${productDeals.length} deals for brand: ${brand}`);
    }

    // Tier 1: Product-specific match
    for (const deal of productDeals) {
      try {
        const codes = JSON.parse(deal.codes as string);
        for (const code of codes) {
          if (code.summary) {
            const summaryWords = new Set(code.summary.toLowerCase().split(' '));
            const productWords = new Set(p.name.toLowerCase().split(' '));
            const intersection = new Set([...summaryWords].filter(x => productWords.has(x)));
            if (intersection.size > 1) { // Require at least 2 matching words
              bestDeal = code;
              break;
            }
          }
        }
      } catch (e) { console.error(e); }
      if (bestDeal) break;
    }

    // Tier 2: Store-wide match
    if (!bestDeal) {
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
      console.log(`Matched deal for ${p.name}:`, bestDeal);
    }

    return {
      ...p,
      deal: bestDeal,
    };
  });
};
