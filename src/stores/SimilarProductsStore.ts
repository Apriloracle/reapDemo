import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

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
    await this.persister.save();
  }

  getSimilarProducts(asin: string) {
    const cachedProducts = this.store.getTable(`similar-${asin}`);
    if (cachedProducts) {
      return Object.values(cachedProducts);
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

