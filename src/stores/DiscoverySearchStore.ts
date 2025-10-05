import { createStore } from 'tinybase';
import { createSessionPersister } from 'tinybase/persisters/persister-browser';
import { addCoordinateToStore } from '../lib/storeCoordinates';

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
    this.store.setValue(`timestamp-${searchTerm}`, Date.now());

    // Add coordinate functionality and update coordinates for the new products.
    const updateCoordinates = addCoordinateToStore(this.store, `search-${searchTerm}`);
    await updateCoordinates();

    await this.persister.save();
  }

  getSearchResults(searchTerm: string) {
    const timestamp = this.store.getValue(`timestamp-${searchTerm}`) as number;
    const oneHour = 60 * 60 * 1000;

    if (timestamp && (Date.now() - timestamp < oneHour)) {
      const cachedProducts = this.store.getTable(`search-${searchTerm}`);
      if (cachedProducts) {
        return Object.values(cachedProducts);
      }
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
