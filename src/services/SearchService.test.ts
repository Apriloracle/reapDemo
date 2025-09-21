import { searchService } from './SearchService';
import { categoryStore } from '../stores/CategoryStore';
import { categoryVectorService } from './CategoryVectorService';

// Mock the dependencies
jest.mock('../stores/CategoryStore');
jest.mock('./CategoryVectorService');

describe('SearchService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should filter out products with missing imageUrls', async () => {
    // Arrange
    const mockAsins = ['asin1', 'asin2', 'asin3'];
    const mockProducts = [
      { asin: 'asin1', title: 'Product 1', imageUrl: 'http://example.com/image1.jpg', price: 10 },
      { asin: 'asin2', title: 'Product 2', imageUrl: '', price: 20 }, // Missing imageUrl
      { asin: 'asin3', title: 'Product 3', imageUrl: 'http://example.com/image3.jpg', price: 30 },
    ];

    const mockCategoryData = new Map();
    mockCategoryData.set('cat1', new Map([
        ['asin1', { hv: new Map(), title: 'Product 1' }],
        ['asin2', { hv: new Map(), title: 'Product 2' }],
        ['asin3', { hv: new Map(), title: 'Product 3' }],
    ]));

    (categoryVectorService.getAllCategoryData as jest.Mock).mockReturnValue(mockCategoryData);
    (categoryStore.getProductsByAsins as jest.Mock).mockResolvedValue(mockProducts);

    // Act
    const results = await searchService.performSearch('test');

    // Assert
    expect(results.length).toBe(2);
    expect(results.find(p => p.asin === 'asin2')).toBeUndefined();
    expect(results[0].imageUrl).not.toBe('');
    expect(results[1].imageUrl).not.toBe('');
  });

  it('should perform a semantic search and return ranked products', async () => {
    // Arrange
    const mockSearchTerm = 'test query';
    const mockProducts = [
      { asin: 'asin1', name: 'Product 1', vector: { '1': 0.5, '2': 0.8 } },
      { asin: 'asin2', name: 'Product 2', vector: { '3': 0.2, '4': 0.9 } },
    ];

    // Mock the fetch call to return our mock product data
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockProducts),
      })
    ) as jest.Mock;

    // Act
    const results = await searchService.performSemanticSearch(mockSearchTerm);

    // Assert
    expect(fetch).toHaveBeenCalledWith('/data/vectors/category_130.json');
    expect(results.length).toBeGreaterThan(0);
    // A more specific assertion would require knowing the exact vectorization and similarity logic
    expect(results[0].asin).toBeDefined();
  });
});
