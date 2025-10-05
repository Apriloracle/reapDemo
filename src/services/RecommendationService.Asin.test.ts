import { RecommendationService } from './RecommendationService';
import { CATEGORY_130_SPARSE_ANCHORS } from '../data/category_130_sparse_anchors';

describe('RecommendationService ASIN Test', () => {
  it('should return recommendations for a given ASIN', () => {
    const recommendationService = new RecommendationService();
    recommendationService.loadAnchors(CATEGORY_130_SPARSE_ANCHORS.anchors);

    const testAsin = '704';
    const recommendations = recommendationService.getRecommendationsByAsins([testAsin]);

    console.log(`Recommendations for ASIN ${testAsin}:`, recommendations);

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
  });
});
