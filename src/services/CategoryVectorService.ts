import { SparseHypervector } from '../lib/sparse-hypervectors';
import category104 from '../data/vectors/category_104.json';
import category126 from '../data/vectors/category_126.json';
import category130 from '../data/vectors/category_130.json';
import category167 from '../data/vectors/category_167.json';

type CategoryDataMap = Map<number, Map<string, { title: string; hv: Map<number, number> }>>;

class CategoryVectorService {
  private categoryData: CategoryDataMap = new Map();
  private static instance: CategoryVectorService;

  private constructor() {
    console.log('CategoryVectorService: Initializing and loading vectors...');
    this.loadCategoryData(104, category104);
    this.loadCategoryData(126, category126);
    this.loadCategoryData(130, category130);
    this.loadCategoryData(167, category167);
    console.log('CategoryVectorService: Initialization complete.');
    console.log('Loaded category IDs:', Array.from(this.categoryData.keys()));
  }

  public static getInstance(): CategoryVectorService {
    if (!CategoryVectorService.instance) {
      CategoryVectorService.instance = new CategoryVectorService();
    }
    return CategoryVectorService.instance;
  }

  private loadCategoryData(categoryId: number, data: any) {
    const productMap = new Map<string, { title: string; hv: Map<number, number> }>();
    for (const asin in data) {
      const product = data[asin];
      productMap.set(asin, {
        title: product.title,
        hv: new Map(Object.entries(product.hv).map(([key, value]) => [parseInt(key), value as number]))
      });
    }
    this.categoryData.set(categoryId, productMap);
    console.log(`CategoryVectorService: Loaded ${productMap.size} products for category ${categoryId}`);
  }

  public getAllCategoryData(): CategoryDataMap {
    return this.categoryData;
  }

  public getCategoryData(categoryId: number): Map<string, { title: string; hv: Map<number, number> }> | undefined {
    return this.categoryData.get(categoryId);
  }
}

export const categoryVectorService = CategoryVectorService.getInstance();
