import { RegistryBrokerClient } from '@hashgraphonline/standards-sdk';

// Configure the client for unauthenticated access to the public registry.
const registryClient = new RegistryBrokerClient({
  baseUrl: 'https://hol.org/registry/api/v1',
  // No apiKey is provided for unauthenticated mode.
});

export default registryClient;

