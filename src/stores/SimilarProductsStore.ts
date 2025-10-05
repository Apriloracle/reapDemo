import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { addCoordinateToStore } from '../lib/storeCoordinates';


class SimilarProductsStore {
  public store;
  private persister: any;

  constructor() {
    this.store = createStore();
    if (typeof window !== 'undefined') {
      this.persister = createLocalPersister(this.store, 'similar-products');
    }
  }

  async initialize() {
    if (this.persister) {
      await this.persister.load();
    }
  }

  async addSimilarProducts(asin: string, products: any[]) {
    const productsTable: Record<string, any> = {};
    products.forEach((product: any) => {
      productsTable[product.asin] = product;
    });

    this.store.setTable(`similar-${asin}`, productsTable);

    // Add coordinate functionality and update coordinates for the new products.
    const updateCoordinates = addCoordinateToStore(this.store, `similar-${asin}`);
    await updateCoordinates();

    await this.persister.save();
  }

  getSimilarProducts(asin: string) {
    const cachedProducts = this.store.getTable(`similar-${asin}`);
    if (cachedProducts) {
      return Object.values(cachedProducts).filter((p: any) => p && p.price > 0);
    }
    return [];
  }

  getProductByAsin(asin: string) {
    const tableNames = this.store.getTableIds();
    for (const tableName of tableNames) {
      const table = this.store.getTable(tableName);
      if (table[asin]) {
        return table[asin];
      }
    }
    return null;
  }
}

export const similarProductsStore = new SimilarProductsStore();
