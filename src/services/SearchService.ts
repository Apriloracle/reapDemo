import { generateSparseHV, add_sparse, similarity_sparse } from '../lib/sparse-hypervectors';
import { categoryVectorService } from './CategoryVectorService';
import { categoryStore } from '../stores/CategoryStore';
import productsWithVectors from '../data/vectors/category_130.json';

const DIMENSION = 100000;
const SPARSITY = 3;

interface Product {
  asin: string;
  name: string;
  imageUrl: string;
  price: number;
}

class SearchService {
  public async performKeywordSearch(searchTerm: string): Promise<Product[]> {
    console.log(`Performing keyword search for: ${searchTerm}`);

    // 1. Generate query vector
    const queryWords = searchTerm.toLowerCase().split(' ');
    let queryHV = {};
    for (const word of queryWords) {
      queryHV = add_sparse(queryHV, await generateSparseHV(word, DIMENSION, SPARSITY));
    }

    // 2. Get all category data
    const allCategoryData = categoryVectorService.getAllCategoryData();

    // 3. Perform a global search across all products in all categories
    const searchResults: { asin: string; name: string; score: number }[] = [];

    allCategoryData.forEach((productMap, categoryId) => {
      productMap.forEach((productData, asin) => {
        const hvObject = Object.fromEntries(productData.hv);
        const score = similarity_sparse(queryHV, hvObject);

        if (score > 0.01) { // Set a threshold to only show relevant items
          searchResults.push({
            asin: asin,
            name: productData.title,
            score: score,
          });
        }
      });
    });

    // 4. Sort all found products by score and take the top 20
    const topResults = searchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // 5. Get full product details from the CategoryStore
    const asins = topResults.map(p => p.asin);
    const productsFromStore = await categoryStore.getProductsByAsins(asins);

    // Create a map for quick lookup
    const productDetailsMap = new Map(productsFromStore.map(p => [p.asin, p]));

    // 6. Merge search results with product details and filter out incomplete products
    const finalProducts: Product[] = topResults
      .map(result => {
        const details = productDetailsMap.get(result.asin);
        const price = details?.price || 0;

        return {
          asin: result.asin,
          name: details?.title || result.name,
          imageUrl: details?.imageUrl || '', // Ensure imageUrl is not undefined
          price: price,
        };
      })
      .filter(product => product.imageUrl && !product.imageUrl.includes('placeholder.com'));

    console.log(`Found ${finalProducts.length} relevant products.`);
    return finalProducts;
  }

  public async performSemanticSearch(searchTerm: string): Promise<Product[]> {
    // 1. Generate query vector using the existing library function
    const queryWords = searchTerm.toLowerCase().split(' ');
    let queryHV = {};
    for (const word of queryWords) {
      queryHV = add_sparse(queryHV, await generateSparseHV(word, DIMENSION, SPARSITY));
    }
    console.log("1. Query Vector:", queryHV);

    // 2. Score products from the imported JSON file
    const scoredProducts = Object.entries(productsWithVectors).map(([asin, productData]) => {
      const score = similarity_sparse(queryHV, productData.hv);
      
      return {
        asin: asin,
        name: productData.title,
        score: score,
      };
    });

    // 3. Sort by score and get the top 20
    const topResults = scoredProducts
      .sort((a, b) => b.score - a.score)
      .filter(p => p.score > 0.05) // Use a threshold to keep results relevant
      .slice(0, 20);
    console.log("2. Top 20 Results (from vector search):", topResults);

    // 4. Fetch full product details for the top results
    const asins = topResults.map(p => p.asin);
    let productsFromStore = await categoryStore.getProductsByAsins(asins);
    console.log("3. Products found in CategoryStore:", productsFromStore);

    // 5. Identify missing products and fetch them
    const foundAsins = new Set(productsFromStore.map(p => p.asin));
    const missingAsins = asins.filter(asin => !foundAsins.has(asin));

    if (missingAsins.length > 0) {
      console.log(`Fetching ${missingAsins.length} missing products...`);
      const fetchedProducts = await categoryStore.fetchProductsByAsins(missingAsins);
      productsFromStore = [...productsFromStore, ...fetchedProducts];
    }

    const productDetailsMap = new Map(productsFromStore.map(p => [p.asin, p]));

    // 6. Merge details and filter out incomplete products
    const finalProducts: Product[] = topResults
      .map(result => {
        const details = productDetailsMap.get(result.asin);
        return {
          asin: result.asin,
          name: details?.title || result.name,
          imageUrl: details?.imageUrl || '',
          price: details?.price || 0,
        };
      })
      .filter(product => product.imageUrl && !product.imageUrl.includes('placeholder.com'));

    return finalProducts;
  }

  public async performServerKeywordSearch(searchTerm: string): Promise<Product[]> {
    try {
      const response = await fetch(`https://productsearchproxy-50775725716.asia-southeast1.run.app/search?q=${searchTerm}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const products = await response.json();
      return products.map((p: any) => ({
        ...p,
        name: p.title,
        imageUrl: p.imgUrl,
      }));
    } catch (error) {
      console.error('Error fetching server search results:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();


