import { HyperseedLearner } from '../lib/hyperseed_sparse_anchor_learner';
import { searchService } from './SearchService';

export class RecommendationService {
  private learner: HyperseedLearner;

  constructor() {
    this.learner = new HyperseedLearner();
  }

  public loadAnchors(anchors: Record<string, number>[]): void {
    this.learner.anchors = anchors;
  }

  public async getRecommendations(userVector: Record<string, number>): Promise<string[]> {
    if (Object.keys(userVector).length === 0) {
      return [];
    }

    const bestAnchor = this.learner.findBestAnchor(userVector);

    if (bestAnchor.index === -1) {
      return [];
    }

    const recommendedAnchor = this.learner.anchors[bestAnchor.index];
    
    // Perform a new search using the recommended anchor vector
    const similarProducts = await searchService.performSemanticSearch(recommendedAnchor);
    
    // Return the ASINs of the similar products
    return similarProducts.map(p => p.asin);
  }

  public async getRecommendationsByVectors(vectors: Record<string, number>[]): Promise<string[]> {
    const allRecommendations: string[] = [];
    for (const vector of vectors) {
      const recommendations = await this.getRecommendations(vector);
      allRecommendations.push(...recommendations);
    }
    // Convert to Set to get unique ASINs, then back to array
    return Array.from(new Set(allRecommendations));
  }
}
