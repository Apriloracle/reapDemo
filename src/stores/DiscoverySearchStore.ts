import { createStore } from 'tinybase';
import { createSessionPersister } from 'tinybase/persisters/persister-browser';

class DiscoverySearchStore {
  public store;
  private persister: any;

  constructor() {
    this.store = createStore();
    if (typeof window !== 'undefined') {
      this.persister = createSessionPersister(this.store, 'discovery-search');
    }
  }

  async initialize() {
    if (this.persister) {
      await this.persister.load();
    }
  }

  async addSearchResults(searchTerm: string, products: any[]) {
    const productsTable: Record<string, any> = {};
    products.forEach((product: any) => {
      productsTable[product.asin] = product;
    });

    this.store.setTable(`search-${searchTerm}`, productsTable);
    await this.persister.save();
  }

  getSearchResults(searchTerm: string) {
    const cachedProducts = this.store.getTable(`search-${searchTerm}`);
    if (cachedProducts) {
      return Object.values(cachedProducts);
    }
    return [];
  }

  getAllProducts() {
    const allProducts: any[] = [];
    const tableIds = this.store.getTableIds();
    for (const tableId of tableIds) {
      const products = this.store.getTable(tableId);
      allProducts.push(...Object.values(products));
    }
    return allProducts;
  }
}

export const discoverySearchStore = new DiscoverySearchStore();
