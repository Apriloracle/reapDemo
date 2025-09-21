import { generateSparseHV, add_sparse, similarity_sparse, SparseHypervector } from '../lib/sparse-hypervectors';
import categoryData from '../data/vectors/category_167.json'; // Using 167 as a test case

const DIMENSION = 100000;
const SPARSITY = 3;

interface Product {
  asin: string;
  name: string;
  imageUrl: string;
  price: number;
}

// This is a global object that will be accessible from the console
(window as any).searchTest = {
  run: async (query: string) => {
    console.log(`--- Starting Search Test for query: "${query}" ---`);

    // 1. Load and prepare the data
    const productMap = new Map<string, { title: string; hv: SparseHypervector }>();
    for (const asin in categoryData) {
      const product = (categoryData as any)[asin];
      const hvObject: SparseHypervector = {};
      for (const key in product.hv) {
        hvObject[key] = product.hv[key];
      }
      productMap.set(asin, {
        title: product.title,
        hv: hvObject
      });
    }
    console.log(`Loaded ${productMap.size} products for the test.`);

    // 2. Generate query vector
    const queryWords = query.toLowerCase().split(' ');
    let queryHV: SparseHypervector = {};
    for (const word of queryWords) {
      queryHV = add_sparse(queryHV, await generateSparseHV(word, DIMENSION, SPARSITY));
    }
    console.log('Generated Query HV:', queryHV);

    // 3. Perform search
    const allProducts: (Product & { score: number })[] = [];
    productMap.forEach((productData, asin) => {
      const score = similarity_sparse(queryHV, productData.hv);
      if (score > 0) {
        allProducts.push({
          asin: asin,
          name: productData.title,
          imageUrl: '',
          price: 0,
          score: score,
        });
      }
    });

    // 4. Sort and log results
    const topProducts = allProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log(`--- Search Test Results ---`);
    console.log(`Found ${topProducts.length} relevant products.`);
    console.table(topProducts);
    console.log(`-------------------------`);
  }
};

// This component does not render anything
const HypervectorSearchTest: React.FC = () => {
  return null;
};

export default HypervectorSearchTest;
