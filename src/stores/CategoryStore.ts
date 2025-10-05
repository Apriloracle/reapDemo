import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { addCoordinateToStore } from '../lib/storeCoordinates';
import categoryIndex from '../data/index.json';

const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Create a lookup map from categoryId to categoryName
const categoryNameMap = new Map(
  categoryIndex.map(item => [item.categoryId.toString(), item.categoryName])
);

class CategoryStore {
  public store = createStore();
  private persister: any;

  constructor() {
    if (typeof window !== 'undefined') {
      this.persister = createLocalPersister(this.store, 'category-products');
    }
  }

  async initialize() {
    if (this.persister) {
      await this.persister.load();
    }
  }

  private isCacheValid(categoryId: string): boolean {
    const metadata = this.store.getTable(`category-meta-${categoryId}`);
    if (!metadata?.info?.lastFetched) return false;
    
    const lastFetched = parseInt(metadata.info.lastFetched as string);
    return Date.now() - lastFetched < CACHE_EXPIRATION_TIME;
  }

  async addProducts(categoryId: string, products: any[]) {
    // Store metadata with timestamp
    this.store.setTable(`category-meta-${categoryId}`, {
      info: {
        lastFetched: Date.now().toString(),
        product_count: products.length,
      }
    });

    // Store products
    const productsTable: Record<string, any> = {};
    products.forEach((product: any) => {
      productsTable[product.asin] = product;
    });

    this.store.setTable(`products-${categoryId}`, productsTable);

    // Add coordinate functionality and update coordinates for the new products.
    const updateCoordinates = addCoordinateToStore(this.store, `products-${categoryId}`);
    await updateCoordinates();

    await this.persister.save();
  }

  async addProductsByCategory(productsByCategory: { [key: string]: any[] }) {
    for (const categoryId in productsByCategory) {
      await this.addProducts(categoryId, productsByCategory[categoryId]);
    }
  }

  async getProducts(categoryId: string, forceRefresh = false): Promise<any[]> {
    // Check cache first
    if (!forceRefresh && this.isCacheValid(categoryId)) {
      const cachedProducts = this.store.getTable(`products-${categoryId}`);
      if (cachedProducts) {
        return Object.values(cachedProducts);
      }
    }
    // If not in cache or forceRefresh, return empty array for now,
    // as fetching logic will be handled by the component for test products.
    return [];
  }

  async fetchProductsByAsins(asins: string[]): Promise<any[]> {
    if (asins.length === 0) {
      return [];
    }

    try {
      const products = await Promise.all(
        asins.map(async (asin) => {
          const response = await fetch(`https://getproductdetails-50775725716.asia-southeast1.run.app/product/${asin}`);
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          return response.json();
        })
      );

      // Assuming the API returns an array of products, group them by category
      const productsByCategory: { [key: string]: any[] } = {};
      for (const product of products) {
        const categoryId = product.category_id || 'unknown';
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = [];
        }
        productsByCategory[categoryId].push(product);
      }

      // Add the fetched products to the store
      for (const categoryId in productsByCategory) {
        await this.addProducts(categoryId, productsByCategory[categoryId]);
      }

      return products;
    } catch (error) {
      console.error('Failed to fetch products by ASINs:', error);
      return [];
    }
  }

  async getDisplayProducts(categoryId: string, limit = 60): Promise<any[]> {
    const cachedProducts = this.store.getTable(`products-${categoryId}`);
    if (cachedProducts) {
      return Object.values(cachedProducts).slice(0, limit);
    }
    return [];
  }

  async getProductsByAsins(asins: string[]): Promise<any[]> {
    const allProducts: any[] = [];
    // Iterate through all tables in the store to find products
    for (const tableId of this.store.getTableIds()) {
      if (tableId.startsWith('products-')) {
        const categoryId = tableId.replace('products-', '');
        const categoryName = categoryNameMap.get(categoryId) || 'Unknown Category';

        const productsTable = this.store.getTable(tableId);
        if (productsTable) {
          for (const asin of asins) {
            if (productsTable[asin]) {
              // Add the category name to the product object
              allProducts.push({
                ...productsTable[asin],
                category: categoryName,
              });
            }
          }
        }
      }
    }
    return allProducts;
  }

  async getRandomProducts(limit = 20): Promise<any[]> {
    const allProducts: any[] = [];
    for (const tableId of this.store.getTableIds()) {
      if (tableId.startsWith('products-')) {
        const productsTable = this.store.getTable(tableId);
        if (productsTable) {
          allProducts.push(...Object.values(productsTable));
        }
      }
    }

    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }
}

export const categoryStore = new CategoryStore();
