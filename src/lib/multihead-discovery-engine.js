// multihead_ecommerce_discovery.js
// Multi-head Hyperseed specialized for e-commerce product discovery

import { sparseSimilarity, sparseReinforceAnchor } from './hyperseed_sparse_anchor_learner.js';

// ========================================
// E-COMMERCE SIMILARITY KERNELS
// ========================================

// Product feature overlap (materials, specs, attributes)
function featureOverlapSimilarity(vecA, vecB, modulus = 16384, tolerance = 5) {
  return sparseSimilarity(vecA, vecB, modulus, tolerance);
}

// Price-aware similarity (closer prices = more similar)
function priceAwareSimilarity(vecA, vecB, priceA, priceB, modulus = 16384, tolerance = 5) {
  const baseSim = sparseSimilarity(vecA, vecB, modulus, tolerance);
  
  if (!priceA || !priceB) return baseSim;
  
  // Price similarity factor (closer prices boost similarity)
  const priceDiff = Math.abs(priceA - priceB);
  const maxPrice = Math.max(priceA, priceB);
  const priceBoost = maxPrice > 0 ? 1 - (priceDiff / maxPrice) : 1;
  
  return baseSim * (0.7 + 0.3 * priceBoost); // 70% feature, 30% price
}

// Style/aesthetic similarity (for fashion, home decor)
function styleSimilarity(vecA, vecB, modulus = 16384, tolerance = 3) {
  // More strict tolerance for style matching
  return sparseSimilarity(vecA, vecB, modulus, tolerance);
}

// Functional similarity (what the product DOES, not how it looks)
function functionalSimilarity(vecA, vecB, modulus = 16384) {
  const keysA = Object.keys(vecA);
  const keysB = Object.keys(vecB);
  
  // Focus on high-value dimensions (likely functional features)
  const functionalKeysA = keysA.filter(k => vecA[k] > modulus * 0.5);
  const functionalKeysB = keysB.filter(k => vecB[k] > modulus * 0.5);
  
  let overlap = 0;
  for (const k of functionalKeysA) {
    if (functionalKeysB.includes(k)) {
      overlap++;
    }
  }
  
  const totalFunctional = new Set([...functionalKeysA, ...functionalKeysB]).size;
  return totalFunctional === 0 ? 0 : overlap / totalFunctional;
}

// ========================================
// E-COMMERCE DISCOVERY HEADS
// ========================================

// Base E-commerce Head
class EcommerceHead {
  constructor(name, kernel, config = {}) {
    this.name = name;
    this.kernel = kernel;
    this.config = config;
    this.stats = { 
      discoveries: 0, 
      conversions: 0, 
      userSessions: 0,
      avgConfidence: 0
    };
  }
  
  processResult(result, vec, anchors, productMeta = {}) {
    return result;
  }
  
  trackConversion(success = true) {
    if (success) this.stats.conversions++;
  }
}

// DISCOVERY HEAD 1: "More Like This" - Similar Products
class SimilarProductsHead extends EcommerceHead {
  constructor(kernel = featureOverlapSimilarity, maxResults = 8) {
    super('similar_products', kernel, { maxResults });
    this.productMetadata = {}; // Store product info for better recommendations
  }
  
  addProductMetadata(anchorIndex, metadata) {
    this.productMetadata[anchorIndex] = {
      category: metadata.category,
      brand: metadata.brand,
      price: metadata.price,
      rating: metadata.rating,
      tags: metadata.tags || []
    };
  }
  
  findSimilarProducts(vec, anchors, userContext = {}) {
    const similarities = anchors.map((anchor, idx) => {
      const baseSim = this.kernel(anchor, vec);
      const meta = this.productMetadata[idx];
      
      let adjustedSim = baseSim;
      
      // Boost similarity based on user preferences
      if (meta && userContext.preferredBrands && userContext.preferredBrands.includes(meta.brand)) {
        adjustedSim *= 1.2;
      }
      
      // Boost if in user's price range
      if (meta && userContext.priceRange && meta.price >= userContext.priceRange[0] && meta.price <= userContext.priceRange[1]) {
        adjustedSim *= 1.1;
      }
      
      return {
        anchorIndex: idx,
        similarity: adjustedSim,
        metadata: meta,
        reason: this.generateReasonCode(baseSim, meta, userContext)
      };
    });
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, this.config.maxResults);
  }
  
  generateReasonCode(similarity, metadata, userContext) {
    if (similarity > 0.8) return "nearly_identical";
    if (similarity > 0.6) return "very_similar";
    if (similarity > 0.4) return "similar_features";
    if (metadata?.brand && userContext.preferredBrands?.includes(metadata.brand)) return "preferred_brand";
    return "related";
  }
  
  processResult(result, vec, anchors, productMeta = {}) {
    this.stats.discoveries++;
    const similar = this.findSimilarProducts(vec, anchors, productMeta.userContext || {});
    
    return {
      ...result,
      similarProducts: similar,
      discoveryType: "similar_products",
      confidence: similar.length > 0 ? similar[0].similarity : 0
    };
  }
}

// DISCOVERY HEAD 2: "Complete The Look" - Complementary Products  
class ComplementaryProductsHead extends EcommerceHead {
  constructor(kernel = functionalSimilarity, maxResults = 6) {
    super('complementary_products', kernel, { maxResults });
    this.complementaryPairs = {}; // Learn which products are bought together
    this.categoryComplements = {
      'electronics': ['cases', 'chargers', 'accessories'],
      'clothing': ['shoes', 'accessories', 'jewelry'],
      'kitchen': ['utensils', 'storage', 'cleaning'],
      'furniture': ['decor', 'lighting', 'storage']
    };
  }
  
  learnComplement(productAnchor, complementAnchor, strength = 1) {
    if (!this.complementaryPairs[productAnchor]) {
      this.complementaryPairs[productAnchor] = {};
    }
    this.complementaryPairs[productAnchor][complementAnchor] = 
      (this.complementaryPairs[productAnchor][complementAnchor] || 0) + strength;
  }
  
  findComplements(vec, anchors, productMeta = {}) {
    const { index } = this.findBestAnchor(vec, anchors);
    
    if (index === -1) return [];
    
    // Check learned complementary pairs first
    const learnedComplements = this.complementaryPairs[index] || {};
    
    // Find functional complements (different function, same category)
    const complements = anchors.map((anchor, idx) => {
      if (idx === index) return null; // Skip self
      
      // Learned complement strength
      const learnedStrength = learnedComplements[idx] || 0;
      
      // Functional complement score (low similarity = different function)
      const functionalScore = 1 - this.kernel(anchor, vec);
      
      // Category complement boost
      let categoryBoost = 1;
      const productCategory = productMeta.category;
      if (productCategory && this.categoryComplements[productCategory]) {
        // This would need category info for each anchor
        categoryBoost = 1.2;
      }
      
      const totalScore = (learnedStrength * 0.6 + functionalScore * 0.4) * categoryBoost;
      
      return {
        anchorIndex: idx,
        complementScore: totalScore,
        reason: learnedStrength > 0 ? "frequently_bought_together" : "functional_complement",
        learnedStrength
      };
    }).filter(Boolean);
    
    complements.sort((a, b) => b.complementScore - a.complementScore);
    return complements.slice(0, this.config.maxResults);
  }
  
  findBestAnchor(vec, anchors) {
    if (anchors.length === 0) return { index: -1, sim: 0 };
    
    let bestIndex = -1;
    let bestSim = -1;
    
    anchors.forEach((anchor, idx) => {
      const sim = this.kernel(anchor, vec);
      if (sim > bestSim) {
        bestSim = sim;
        bestIndex = idx;
      }
    });
    
    return { index: bestIndex, sim: bestSim };
  }
  
  processResult(result, vec, anchors, productMeta = {}) {
    this.stats.discoveries++;
    const complements = this.findComplements(vec, anchors, productMeta);
    
    return {
      ...result,
      complementaryProducts: complements,
      discoveryType: "complete_the_look",
      confidence: complements.length > 0 ? complements[0].complementScore : 0
    };
  }
}

// DISCOVERY HEAD 3: "Budget Alternative" - Price-based Discovery
class BudgetAlternativeHead extends EcommerceHead {
  constructor(kernel = priceAwareSimilarity, priceThreshold = 0.7) {
    super('budget_alternatives', kernel, { priceThreshold });
    this.priceIndex = {}; // anchorIndex -> price info
  }
  
  setPriceInfo(anchorIndex, price, brand = null) {
    this.priceIndex[anchorIndex] = { price, brand };
  }
  
  findBudgetAlternatives(vec, anchors, targetPrice, maxPrice = null) {
    const alternatives = anchors.map((anchor, idx) => {
      const priceInfo = this.priceIndex[idx];
      if (!priceInfo || !priceInfo.price) return null;
      
      const price = priceInfo.price;
      const maxAllowed = maxPrice || (targetPrice * 1.5);
      
      // Skip if too expensive
      if (price > maxAllowed) return null;
      
      // Calculate savings
      const savings = Math.max(0, targetPrice - price);
      const savingsPercent = targetPrice > 0 ? (savings / targetPrice) * 100 : 0;
      
      // Feature similarity
      const similarity = this.kernel === priceAwareSimilarity 
        ? priceAwareSimilarity(anchor, vec, price, targetPrice)
        : this.kernel(anchor, vec);
      
      // Combined score: similarity + savings benefit
      const score = similarity * 0.7 + (savingsPercent / 100) * 0.3;
      
      return {
        anchorIndex: idx,
        price: price,
        targetPrice: targetPrice,
        savings: savings,
        savingsPercent: Math.round(savingsPercent),
        similarity: similarity,
        score: score,
        brand: priceInfo.brand,
        reason: savingsPercent > 20 ? "great_savings" : "similar_price"
      };
    }).filter(Boolean);
    
    // Sort by combined score
    alternatives.sort((a, b) => b.score - a.score);
    return alternatives;
  }
  
  processResult(result, vec, anchors, productMeta = {}) {
    this.stats.discoveries++;
    const userBudget = productMeta.userContext?.budget;
    const currentPrice = productMeta.price;
    
    if (!userBudget || !currentPrice) {
      return { ...result, budgetAlternatives: [], confidence: 0 };
    }
    
    const alternatives = this.findBudgetAlternatives(vec, anchors, currentPrice, userBudget);
    
    return {
      ...result,
      budgetAlternatives: alternatives,
      discoveryType: "budget_alternatives",
      confidence: alternatives.length > 0 ? alternatives[0].score : 0
    };
  }
}

// DISCOVERY HEAD 4: "Trending Now" - Popularity-based Discovery
class TrendingProductsHead extends EcommerceHead {
  constructor(kernel = featureOverlapSimilarity, trendWindow = 7) {
    super('trending_products', kernel, { trendWindow });
    this.viewCounts = {}; // anchorIndex -> view metrics
    this.purchaseCounts = {};
    this.timeDecay = 0.9; // Daily decay factor
  }
  
  recordView(anchorIndex, timestamp = Date.now()) {
    if (!this.viewCounts[anchorIndex]) {
      this.viewCounts[anchorIndex] = [];
    }
    this.viewCounts[anchorIndex].push(timestamp);
  }
  
  recordPurchase(anchorIndex, timestamp = Date.now()) {
    if (!this.purchaseCounts[anchorIndex]) {
      this.purchaseCounts[anchorIndex] = [];
    }
    this.purchaseCounts[anchorIndex].push(timestamp);
  }
  
  calculateTrendingScore(anchorIndex) {
    const now = Date.now();
    const windowMs = this.config.trendWindow * 24 * 60 * 60 * 1000;
    
    const views = (this.viewCounts[anchorIndex] || [])
      .filter(t => (now - t) < windowMs);
    const purchases = (this.purchaseCounts[anchorIndex] || [])
      .filter(t => (now - t) < windowMs);
    
    // Weight recent activity more heavily
    let weightedViews = 0;
    let weightedPurchases = 0;
    
    views.forEach(timestamp => {
      const daysOld = (now - timestamp) / (24 * 60 * 60 * 1000);
      const weight = Math.pow(this.timeDecay, daysOld);
      weightedViews += weight;
    });
    
    purchases.forEach(timestamp => {
      const daysOld = (now - timestamp) / (24 * 60 * 60 * 1000);
      const weight = Math.pow(this.timeDecay, daysOld);
      weightedPurchases += weight;
    });
    
    // Purchases worth 5x views
    return weightedViews + (weightedPurchases * 5);
  }
  
  findTrendingProducts(vec, anchors, minSimilarity = 0.3) {
    const trending = anchors.map((anchor, idx) => {
      const similarity = this.kernel(anchor, vec);
      
      if (similarity < minSimilarity) return null;
      
      const trendingScore = this.calculateTrendingScore(idx);
      const combinedScore = similarity * 0.4 + (trendingScore / 100) * 0.6;
      
      return {
        anchorIndex: idx,
        similarity: similarity,
        trendingScore: trendingScore,
        combinedScore: combinedScore,
        views: (this.viewCounts[idx] || []).length,
        purchases: (this.purchaseCounts[idx] || []).length,
        reason: trendingScore > 50 ? "hot_trending" : "gaining_popularity"
      };
    }).filter(Boolean);
    
    trending.sort((a, b) => b.combinedScore - a.combinedScore);
    return trending;
  }
  
  processResult(result, vec, anchors, productMeta = {}) {
    this.stats.discoveries++;
    const trending = this.findTrendingProducts(vec, anchors, 0.2);
    
    return {
      ...result,
      trendingProducts: trending,
      discoveryType: "trending_now",
      confidence: trending.length > 0 ? trending[0].combinedScore : 0
    };
  }
}

// ========================================
// E-COMMERCE MULTI-HEAD DISCOVERY ENGINE
// ========================================

export class EcommerceDiscoveryEngine {
  constructor(modulus = 16384, maxAnchorDimensions = 100) {
    this.modulus = modulus;
    this.maxAnchorDimensions = maxAnchorDimensions;
    this.anchors = []; // Shared product anchor memory
    this.heads = new Map(); // Discovery heads
    
    this.stats = {
      totalProducts: 0,
      totalDiscoveries: 0,
      conversions: 0,
      userSessions: 0
    };
    
    // Initialize e-commerce discovery heads
    this.addHead(new SimilarProductsHead(featureOverlapSimilarity, 8));
    this.addHead(new ComplementaryProductsHead(functionalSimilarity, 6));
    this.addHead(new BudgetAlternativeHead(priceAwareSimilarity, 0.7));
    this.addHead(new TrendingProductsHead(featureOverlapSimilarity, 7));
  }
  
  addHead(head) {
    this.heads.set(head.name, head);
    console.log(`Added ${head.name} discovery head`);
  }
  
  // Add product to discovery engine
  learnProduct(productVector, productMetadata) {
    const { 
      id, 
      category, 
      brand, 
      price, 
      title,
      rating = 0,
      tags = []
    } = productMetadata;
    
    this.stats.totalProducts++;
    
    // Find or create anchor
    let anchorIndex = -1;
    let bestSim = -1;
    
    this.anchors.forEach((anchor, idx) => {
      const sim = featureOverlapSimilarity(anchor, productVector, this.modulus);
      if (sim > bestSim) {
        bestSim = sim;
        anchorIndex = idx;
      }
    });
    
    const threshold = 0.15;
    
    if (anchorIndex === -1 || bestSim < threshold) {
      // Create new anchor
      let newAnchor = { ...productVector };
      
      // Compress if needed
      if (Object.keys(newAnchor).length > this.maxAnchorDimensions) {
        const entries = Object.entries(newAnchor);
        entries.sort((a, b) => b[1] - a[1]);
        newAnchor = {};
        for (let i = 0; i < this.maxAnchorDimensions; i++) {
          newAnchor[entries[i][0]] = entries[i][1];
        }
      }
      
      this.anchors.push(newAnchor);
      anchorIndex = this.anchors.length - 1;
    } else {
      // Reinforce existing anchor
      this.anchors[anchorIndex] = sparseReinforceAnchor(
        this.anchors[anchorIndex], 
        productVector, 
        this.modulus, 
        this.maxAnchorDimensions
      );
    }
    
    // Update heads with product metadata
    this.heads.get('similar_products').addProductMetadata(anchorIndex, {
      category, brand, price, rating, tags
    });
    
    this.heads.get('budget_alternatives').setPriceInfo(anchorIndex, price, brand);
    
    return {
      action: anchorIndex === this.anchors.length - 1 ? "new_anchor" : "reinforced",
      anchorIndex,
      productId: id
    };
  }
  
  // Main discovery function - returns personalized recommendations
  discoverProducts(productVector, userContext = {}) {
    this.stats.totalDiscoveries++;
    
    const discoveries = {};
    
    // Get discoveries from each head
    for (const [headName, head] of this.heads) {
      const baseResult = { 
        action: "discover",
        timestamp: Date.now()
      };
      
      const productMeta = {
        userContext: {
          budget: userContext.budget,
          preferredBrands: userContext.preferredBrands || [],
          priceRange: userContext.priceRange || [0, Infinity],
          categories: userContext.preferredCategories || []
        }
      };
      
      discoveries[headName] = head.processResult(baseResult, productVector, this.anchors, productMeta);
    }
    
    return {
      discoveries,
      totalAnchors: this.anchors.length,
      userContext,
      timestamp: Date.now()
    };
  }
  
  // Track user interactions for trending
  recordInteraction(productVector, interactionType = 'view') {
    const trendingHead = this.heads.get('trending_products');
    
    // Find best matching anchor
    let bestAnchor = -1;
    let bestSim = -1;
    
    this.anchors.forEach((anchor, idx) => {
      const sim = featureOverlapSimilarity(anchor, productVector, this.modulus);
      if (sim > bestSim) {
        bestSim = sim;
        bestAnchor = idx;
      }
    });
    
    if (bestAnchor !== -1 && bestSim > 0.001) {
      if (interactionType === 'view') {
        trendingHead.recordView(bestAnchor);
      } else if (interactionType === 'purchase') {
        trendingHead.recordPurchase(bestAnchor);
        this.stats.conversions++;
      }
    }
  }
  
  // Learn product relationships (for complementary products)
  recordComplementaryPurchase(productVectorA, productVectorB) {
    const complementHead = this.heads.get('complementary_products');
    
    // Find anchors for both products
    const anchorA = this.findBestAnchor(productVectorA);
    const anchorB = this.findBestAnchor(productVectorB);
    
    if (anchorA.index !== -1 && anchorB.index !== -1 && anchorA.index !== anchorB.index) {
      complementHead.learnComplement(anchorA.index, anchorB.index);
      complementHead.learnComplement(anchorB.index, anchorA.index); // Bidirectional
    }
  }
  
  findBestAnchor(vec) {
    if (this.anchors.length === 0) return { index: -1, sim: 0 };
    
    let bestIndex = -1;
    let bestSim = -1;
    
    this.anchors.forEach((anchor, idx) => {
      const sim = featureOverlapSimilarity(anchor, vec, this.modulus);
      if (sim > bestSim) {
        bestSim = sim;
        bestIndex = idx;
      }
    });
    
    return { index: bestIndex, sim: bestSim };
  }
  
  getStats() {
    const headStats = {};
    for (const [name, head] of this.heads) {
      headStats[name] = head.stats;
    }
    
    return {
      engine: this.stats,
      anchors: {
        count: this.anchors.length,
        avgDimensions: this.anchors.length > 0 ? 
          this.anchors.reduce((sum, a) => sum + Object.keys(a).length, 0) / this.anchors.length : 0
      },
      heads: headStats,
      memoryUsage: `${(JSON.stringify(this.anchors).length / 1024).toFixed(1)}KB`
    };
  }
  
  export() {
    return {
      version: "ecommerce-discovery-1.0",
      domain: "e-commerce",
      config: {
        modulus: this.modulus,
        maxAnchorDimensions: this.maxAnchorDimensions
      },
      anchors: this.anchors,
      heads: Array.from(this.heads.entries()).map(([name, head]) => ({
        name,
        type: head.constructor.name,
        config: head.config,
        stats: head.stats
      })),
      stats: this.getStats(),
      created: new Date().toISOString()
    };
  }
}

// Export heads and kernels for custom configurations
export { 
  featureOverlapSimilarity,
  priceAwareSimilarity,
  styleSimilarity,
  functionalSimilarity,
  SimilarProductsHead,
  ComplementaryProductsHead,
  BudgetAlternativeHead,
  TrendingProductsHead,
  EcommerceHead
};
