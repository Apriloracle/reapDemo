import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { addCoordinateToStore } from '../lib/storeCoordinates';

class ShoppingProductsStore {
  public store;
  private persister: any;

  constructor() {
    this.store = createStore();
    if (typeof window !== 'undefined') {
      this.persister = createLocalPersister(this.store, 'shopping-products');
    }
  }

  async initialize() {
    if (this.persister) {
      await this.persister.load();
    }
  }

  async addProducts(products: any[]) {
    const productsTable: Record<string, any> = {};
    products.forEach((product: any) => {
      productsTable[product.productId] = product;
    });

    this.store.setTable('products', productsTable);

    // Add coordinate functionality and update coordinates for the new products.
    const updateCoordinates = addCoordinateToStore(this.store, 'products');
    await updateCoordinates();

    await this.persister.save();
  }

  getProducts() {
    const products = this.store.getTable('products');
    return products ? Object.values(products) : [];
  }
}

export const shoppingProductsStore = new ShoppingProductsStore();
