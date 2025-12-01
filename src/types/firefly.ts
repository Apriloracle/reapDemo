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
  output: FireflyEventOutput;
  info: {
    transactionHash: string;
    blockNumber: string;
    timestamp: string;
  };
}

// The clean shape your app will actually use
export interface Agent {
  fireflyId: string;
  agentId: string;
  wallet: string;
  metadataUri: string;
  timestamp: string;
}
