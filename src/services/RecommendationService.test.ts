import { HyperseedLearner } from '../lib/hyperseed_sparse_anchor_learner';
import { CATEGORY_130_SPARSE_ANCHORS } from '../data/category_130_sparse_anchors';
import { RecommendationService } from './RecommendationService';

// Mock the HyperseedLearner
jest.mock('../lib/hyperseed_sparse_anchor_learner', () => ({
  HyperseedLearner: jest.fn().mockImplementation(() => ({
    anchors: [],
    learn: jest.fn(),
    findBestAnchor: jest.fn(),
  })),
}));

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;
  let mockLearner: jest.Mocked<HyperseedLearner>;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (HyperseedLearner as jest.Mock).mockClear();

    // Create a new instance of the service, which will use the mocked learner
    recommendationService = new RecommendationService();
    
    // Get a reference to the mocked learner instance
    mockLearner = (HyperseedLearner as jest.Mock).mock.instances[0];
  });

  it('should initialize the HyperseedLearner with pre-trained anchors', () => {
    // The service's constructor should load the anchors
    recommendationService.loadAnchors(CATEGORY_130_SPARSE_ANCHORS.anchors);
    
    // Verify that the learner's anchors property was set
    expect(mockLearner.anchors).toEqual(CATEGORY_130_SPARSE_ANCHORS.anchors);
  });

  it('should return a list of recommended product ASINs for a given user vector', () => {
    // Setup: Load anchors and mock the findBestAnchor method
    const userVector = { '704': 16221, '767': 16288 };
    const bestAnchor = {
      index: 0,
      sim: 0.9,
      anchor: { '704': 16221, '767': 16288, '3169': 14826 }
    };
    
    mockLearner.findBestAnchor.mockReturnValue({ index: bestAnchor.index, sim: bestAnchor.sim });
    mockLearner.anchors = [bestAnchor.anchor];

    // Act: Get recommendations
    const recommendations = recommendationService.getRecommendations(userVector);

    // Assert: Check that the correct ASINs are returned
    expect(mockLearner.findBestAnchor).toHaveBeenCalledWith(userVector);
    expect(recommendations).toEqual(expect.arrayContaining(['704', '767', '3169']));
  });

  it('should return an empty array if no suitable anchor is found', () => {
    // Setup: Mock findBestAnchor to return no match
    const userVector = { '9999': 12345 };
    mockLearner.findBestAnchor.mockReturnValue({ index: -1, sim: 0 });

    // Act: Get recommendations
    const recommendations = recommendationService.getRecommendations(userVector);

    // Assert: Check that an empty array is returned
    expect(mockLearner.findBestAnchor).toHaveBeenCalledWith(userVector);
    expect(recommendations).toEqual([]);
  });

  it('should handle an empty user vector gracefully', () => {
    // Act: Get recommendations with an empty vector
    const recommendations = recommendationService.getRecommendations({});

    // Assert: Check that an empty array is returned
    expect(mockLearner.findBestAnchor).not.toHaveBeenCalled();
    expect(recommendations).toEqual([]);
  });
});
