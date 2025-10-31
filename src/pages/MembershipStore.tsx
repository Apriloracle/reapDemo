import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

class MembershipStore {
  store = createStore();
  persister: any = null;
  isInitialized = false;

  initialize() {
    // Only initialize on client side
    if (typeof window === 'undefined' || this.isInitialized) {
      return;
    }

    // Create persister only in browser
    this.persister = createLocalPersister(this.store, 'membershipStore');
    
    // Set default value if needed
    if (!this.store.getCell('membership', 'member', 'isMember')) {
      this.store.setCell('membership', 'member', 'isMember', false);
    }

    // Load persisted data
    this.persister.load().then(() => {
      this.isInitialized = true;
    });
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
