// src/services/DataProbeService.ts

import { addUserAction } from '../stores/CoordinateIndexStore';

export const dataProbeService = {
  logInteraction(coordinate: number, type: 'click' | 'view'): void {
    try {
      console.log(`DataProbeService: Logging interaction for coordinate ${coordinate}, type: ${type}`);
      addUserAction({ coordinate, type });
    } catch (err) {
      console.error('Error in DataProbeService:', err);
    }
  }
};
