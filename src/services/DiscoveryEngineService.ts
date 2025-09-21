import { EcommerceDiscoveryEngine } from '../lib/multihead-discovery-engine.js';
import { loadAnchors, saveAnchors } from '../lib/indexedDbHelper';
import { Product } from '../lib/types';
import initialProducts from '../data/category_130_sparse_anchors_browser.json';

// You may need to create a .d.ts file for the JS module to get proper typing
// For now, we'll use 'any' for the engine instance.

class DiscoveryEngineService {
  private static instance: DiscoveryEngineService;
  private engine: any;

  private constructor() {
    this.engine = new EcommerceDiscoveryEngine();
  }

  public static getInstance(): DiscoveryEngineService {
    if (!DiscoveryEngineService.instance) {
      DiscoveryEngineService.instance = new DiscoveryEngineService();
    }
    return DiscoveryEngineService.instance;
  }

  public async initialize(): Promise<void> {
    let anchors = await loadAnchors();
    if (!anchors || anchors.length === 0) {
      console.log('No anchors found in IndexedDB, loading from initial data...');
      anchors = (initialProducts as any).anchors;
      if (anchors) {
        await saveAnchors(anchors);
      }
    }
    if (anchors) {
      this.engine.anchors = anchors;
    }
    
    // Seed the metadata
    const similarProductsHead = this.engine.heads.get('similar_products');
    if (similarProductsHead) {
      // We need a proper product catalog for this. For now, we'll simulate it.
      // This assumes the anchors themselves can serve as a proxy for the catalog.
      this.engine.anchors.forEach((anchor: any, index: number) => {
        const productMetadata = {
          asin: Object.keys(anchor)[0], // Placeholder: assumes first key is ASIN
          title: `Product ${index + 1}`,
          price: Math.floor(Math.random() * 100) + 1,
          brand: 'Brand Name',
          category: 'Category Name',
        };
        similarProductsHead.addProductMetadata(index, productMetadata);
      });
    }

    console.log(`DiscoveryEngineService initialized with ${this.engine.anchors.length} anchors.`);
  }

  public async discover(
    userVector: Record<string, number>,
    userContext: any
  ): Promise<any> {
    return this.engine.discoverProducts(userVector, userContext);
  }

  public async learnProduct(
    productVector: Record<string, number>,
    productMetadata: any
  ): Promise<void> {
    this.engine.learnProduct(productVector, productMetadata);
    await saveAnchors(this.engine.anchors);
  }
}

export const discoveryEngineService = DiscoveryEngineService.getInstance();
