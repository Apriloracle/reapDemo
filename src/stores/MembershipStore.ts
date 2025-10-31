import { createStore } from 'tinybase';

class MembershipStore {
  store = createStore();
  persister: any = null;
  isInitialized = false;

  async initialize() {
    // Only initialize on client side
    if (typeof window === 'undefined' || this.isInitialized) {
      return;
    }

    try {
      // Dynamically import persister only on client side
      const { createLocalPersister } = await import('tinybase/persisters/persister-browser');
      
      // Create persister only in browser
      this.persister = createLocalPersister(this.store, 'membershipStore');
      
      // Set default value if needed
      if (!this.store.getCell('membership', 'member', 'isMember')) {
        this.store.setCell('membership', 'member', 'isMember', false);
      }

      // Load persisted data
      await this.persister.load();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize membership store:', error);
      // Set default value even if persister fails
      if (!this.store.getCell('membership', 'member', 'isMember')) {
        this.store.setCell('membership', 'member', 'isMember', false);
      }
    }
  }

  async saveMembership(isMember: boolean) {
    this.store.setCell('membership', 'member', 'isMember', isMember);
    if (this.persister) {
      await this.persister.save();
    }
  }

  getMembership(): boolean {
    return this.store.getCell('membership', 'member', 'isMember') as boolean || false;
  }
}

export const membershipStore = new MembershipStore();
