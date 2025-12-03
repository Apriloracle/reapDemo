export interface FireflyEventOutput {
  agentId?: string;
  owner?: string;
  agentWallet?: string; // Sometimes Firefly varies naming based on ABI
  to?: string;
  tokenURI?: string;
  metadata?: string;
}

export interface FireflyBlockchainEvent {
  id: string;
  sequence: number;  // Add this for pagination
  type?: string;
  namespace?: string;
  reference?: string;
  topic?: string;
  created?: string;
  blockchainEvent: {
    output: FireflyEventOutput;
    info: {
      transactionHash: string;
      blockNumber: string;
      timestamp: string;
    };
  };
}

// The clean shape your app will actually use
export interface Agent {
  fireflyId: string;
  agentId: string;
  wallet: string;
  metadataUri: string;
  timestamp: string;
  metadata?: string;
}
