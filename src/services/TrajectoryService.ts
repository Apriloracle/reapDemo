import trajectoryStore from '../stores/TrajectoryStore';
import { Product } from '../lib/types';
import { memoryStreamService } from './MemoryStreamService';

class TrajectoryService {
  private store = trajectoryStore;

  public async initialize() {
    console.log('TrajectoryService initialized.');
    return Promise.resolve();
  }

  public async generateTrajectory(product: Product) {
    console.log("TrajectoryService: Starting memory stream for product:", product.asin);
    await memoryStreamService.startStream(product.asin);
  }

  public async stopTrajectory() {
    console.log("TrajectoryService: Stopping memory stream.");
    memoryStreamService.stopStream();
  }
}

const trajectoryService = new TrajectoryService();
export default trajectoryService;
