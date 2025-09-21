// hyperseed_sparse_anchor_learner.js
// Sparse-100 anchor learner compatible with export_trained_anchors.js

// Sparse similarity function (same as original)
function sparseSimilarity(vecA, vecB, modulus = 16384, tolerance = 5) {
  if (!vecA || !vecB || typeof vecA !== 'object' || typeof vecB !== 'object') {
    return 0;
  }
  
  const keysA = Object.keys(vecA);
  const keysB = Object.keys(vecB);
  
  if (keysA.length === 0 || keysB.length === 0) {
    return 0;
  }
  
  let close = 0;
  for (const k of keysA) {
    if (vecB[k] !== undefined) {
      const a = vecA[k];
      const b = vecB[k];
      const diff = Math.abs(a - b);
      const modDist = Math.min(diff, modulus - diff);
      if (modDist <= tolerance) {
        close++;
      }
    }
  }
  return close / Math.max(keysA.length, keysB.length);
}

// Compress anchor to top K dimensions by value
function compressAnchorTopK(anchor, maxDimensions = 100) {
  // Convert to entries and sort by value (descending)
  const entries = Object.entries(anchor);
  entries.sort((a, b) => b[1] - a[1]);
  
  // Keep only top K dimensions
  const compressed = {};
  for (let i = 0; i < Math.min(maxDimensions, entries.length); i++) {
    compressed[entries[i][0]] = entries[i][1];
  }
  
  return compressed;
}

// Alternative: Compress by most frequently reinforced dimensions
function compressAnchorFrequency(anchor, reinforcementCounts, maxDimensions = 100) {
  const entries = Object.entries(anchor);
  
  // Sort by reinforcement frequency (most reinforced first)
  entries.sort((a, b) => {
    const freqA = reinforcementCounts[a[0]] || 1;
    const freqB = reinforcementCounts[b[0]] || 1;
    return freqB - freqA;
  });
  
  // Keep only top K most reinforced dimensions
  const compressed = {};
  for (let i = 0; i < Math.min(maxDimensions, entries.length); i++) {
    compressed[entries[i][0]] = entries[i][1];
  }
  
  return compressed;
}

// Sparse reinforcement with compression
function sparseReinforceAnchor(anchor, vec, modulus, maxDimensions = 100, reinforcementCounts = null) {
  // First, do normal reinforcement
  const updated = { ...anchor };
  for (const [k, v] of Object.entries(vec)) {
    if (updated[k] !== undefined) {
      updated[k] = (updated[k] + v) % modulus;
    } else {
      updated[k] = v;
    }
    
    // Track reinforcement counts if provided
    if (reinforcementCounts) {
      reinforcementCounts[k] = (reinforcementCounts[k] || 0) + 1;
    }
  }
  
  // Then compress to maxDimensions
  if (reinforcementCounts) {
    return compressAnchorFrequency(updated, reinforcementCounts, maxDimensions);
  } else {
    return compressAnchorTopK(updated, maxDimensions);
  }
}

// Main Sparse HyperseedLearner - COMPATIBLE WITH EXPORT SYSTEM
export class HyperseedLearner {
  constructor(modulus = 16384, maxAnchorDimensions = 100, compressionStrategy = 'topK') {
    this.modulus = modulus;
    this.maxAnchorDimensions = maxAnchorDimensions;
    this.compressionStrategy = compressionStrategy;
    this.anchors = []; // Sparse anchors (compressed to 100 dims each)
    
    // Track reinforcement frequency for each dimension (if using frequency strategy)
    this.reinforcementCounts = {}; // { anchorIndex: { dim: count, ... } }
    
    // Statistics
    this.stats = {
      totalProcessed: 0,
      reinforcements: 0,
      newAnchors: 0,
      dimensionsCompressed: 0
    };
  }

  // Find best-matching anchor for a sparse vector
  findBestAnchor(vec) {
    if (this.anchors.length === 0) return { index: -1, sim: 0 };
    
    let bestIndex = -1;
    let bestSim = -1;
    
    this.anchors.forEach((anchor, idx) => {
      const sim = sparseSimilarity(anchor, vec, this.modulus);
      if (sim > bestSim) {
        bestSim = sim;
        bestIndex = idx;
      }
    });
    
    return { index: bestIndex, sim: bestSim };
  }

  // Learn from a sparse vector with compression
  learn(vec, threshold = 0.001) {
    // Input validation
    if (!vec || typeof vec !== 'object' || Object.keys(vec).length === 0) {
      console.error('Invalid vector passed to learn:', vec);
      return { action: "error", message: "Invalid vector" };
    }
    
    const { index, sim } = this.findBestAnchor(vec);
    this.stats.totalProcessed++;
    
    if (index === -1 || sim < threshold) {
      // Create new anchor - compress immediately if needed
      let newAnchor = { ...vec };
      
      if (Object.keys(newAnchor).length > this.maxAnchorDimensions) {
        newAnchor = compressAnchorTopK(newAnchor, this.maxAnchorDimensions);
        this.stats.dimensionsCompressed++;
      }
      
      this.anchors.push(newAnchor);
      
      // Initialize reinforcement tracking for this anchor
      if (this.compressionStrategy === 'frequency') {
        this.reinforcementCounts[this.anchors.length - 1] = {};
        Object.keys(newAnchor).forEach(dim => {
          this.reinforcementCounts[this.anchors.length - 1][dim] = 1;
        });
      }
      
      this.stats.newAnchors++;
      
      return { 
        action: "new_anchor", 
        sim, 
        anchorIndex: this.anchors.length - 1,
        dimensions: Object.keys(newAnchor).length
      };
    } else {
      // Reinforce existing anchor with compression
      const reinforcementCounts = this.compressionStrategy === 'frequency' 
        ? this.reinforcementCounts[index] 
        : null;
      
      const originalDims = Object.keys(this.anchors[index]).length;
      
      this.anchors[index] = sparseReinforceAnchor(
        this.anchors[index], 
        vec, 
        this.modulus, 
        this.maxAnchorDimensions,
        reinforcementCounts
      );
      
      const newDims = Object.keys(this.anchors[index]).length;
      if (newDims < originalDims + Object.keys(vec).length) {
        this.stats.dimensionsCompressed++;
      }
      
      this.stats.reinforcements++;
      
      return { 
        action: "reinforced", 
        index, 
        sim,
        dimensions: newDims
      };
    }
  }

  // Get comprehensive statistics
  getStats() {
    const totalDimensions = this.anchors.reduce((sum, anchor) => sum + Object.keys(anchor).length, 0);
    const avgDimensions = this.anchors.length > 0 ? totalDimensions / this.anchors.length : 0;
    
    return {
      ...this.stats,
      anchorCount: this.anchors.length,
      totalDimensions,
      avgDimensions: parseFloat(avgDimensions.toFixed(1)),
      compressionRatio: this.stats.totalProcessed > 0 ? 
        parseFloat((this.stats.totalProcessed / this.anchors.length).toFixed(2)) : 0,
      memoryEstimate: `${(JSON.stringify(this.anchors).length / 1024).toFixed(1)}KB`
    };
  }

  // Export method compatible with existing export system
  exportAnchors() {
    return {
      version: "sparse-100",
      type: "sparse_hyperseed_learner",
      config: {
        modulus: this.modulus,
        maxAnchorDimensions: this.maxAnchorDimensions,
        compressionStrategy: this.compressionStrategy
      },
      anchors: this.anchors,
      stats: this.getStats(),
      created: new Date().toISOString()
    };
  }
}

// Export utility functions for compatibility
export { sparseSimilarity, compressAnchorTopK, compressAnchorFrequency, sparseReinforceAnchor };