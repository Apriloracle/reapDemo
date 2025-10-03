import { VerificationConfig } from '../types/types.ts';
import { IConfigStorage } from './interface.ts';

export class InMemoryConfigStore implements IConfigStorage {
  private configs: Map<string, VerificationConfig> = new Map();
  private getActionIdFunc: IConfigStorage['getActionId'];

  constructor(getActionIdFunc: IConfigStorage['getActionId']) {
    this.getActionIdFunc = getActionIdFunc;
  }

  async getActionId(userIdentifier: string, userDefinedData: string): Promise<string> {
    return this.getActionIdFunc(userIdentifier, userDefinedData);
  }

  async setConfig(configId: string, config: VerificationConfig): Promise<boolean> {
    const existed = this.configs.has(configId);
    this.configs.set(configId, config);
    return !existed;
  }

async getConfig(configId: string): Promise<VerificationConfig> {
    const config = this.configs.get(configId);

    // This is the FIX:
    // Check if the config was found. If not, throw an error.
    if (!config) {
      throw new Error(`Configuration with ID "${configId}" not found.`);
    }

    // If the code reaches here, TypeScript knows `config` is a valid VerificationConfig.
    return config;
  }
}
