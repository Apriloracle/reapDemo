import experimentsConfig from '../config/experiments.json';
import { get, set } from '../lib/indexedDbHelper';

export class ExperimentService {
  private static assignments: Record<string, string> = {};

  public static async getVariant(experimentName: string, userId: string): Promise<string> {
    if (this.assignments[experimentName]) {
      return this.assignments[experimentName];
    }

    // Check IndexedDB for a saved assignment
    const savedAssignment = await get<{ variant: string }>(`experimentAssignments_${experimentName}`);
    if (savedAssignment) {
      this.assignments[experimentName] = savedAssignment.variant;
      return savedAssignment.variant;
    }

    // If no assignment, create one
    const experiment = (experimentsConfig as any)[experimentName];
    if (!experiment) {
      return 'control'; // Default if experiment is not configured
    }

    const variant = this.assignVariant(userId, experiment.variants);
    
    // Save the new assignment
    await set(`experimentAssignments_${experimentName}`, { variant });
    this.assignments[experimentName] = variant;
    
    return variant;
  }

  private static assignVariant(userId: string, variants: Record<string, number>): string {
    // Simple hashing logic to deterministically assign a user to a bucket
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bucket = hash % 100;

    let cumulativePercentage = 0;
    for (const variant in variants) {
      cumulativePercentage += variants[variant];
      if (bucket < cumulativePercentage) {
        return variant;
      }
    }
    return 'control'; // Fallback
  }
}
