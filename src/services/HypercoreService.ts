// @ts-nocheck
import b4a from 'b4a';
import sodium from 'sodium-native';
import Corestore from 'corestore';
import Hyperswarm from 'hyperswarm';
import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { ReapClient } from '@reap-protocol/sdk';

class ReapGrid {
  /**
   * Converts a Reap Coordinate (uint256 string) into a Network Topic (Buffer).
   */
  getTopic(coordinate: string): Buffer {
    // 1. Parse the coordinate string to BigInt
    const bigIntCoord = BigInt(coordinate);
    
    // 2. Convert to Hex
    let hex = bigIntCoord.toString(16);
    
    // 3. Pad to 64 chars (32 bytes) to match EVM storage layout
    hex = hex.padStart(64, '0'); 
    
    // 4. Return as Buffer
    return b4a.from(hex, 'hex');
  }

  /**
   * Helper to verify if a topic matches a coordinate
   */
  verifyTopic(topicBuffer: Buffer, coordinate: string): boolean {
    const expected = this.getTopic(coordinate);
    return b4a.equals(topicBuffer, expected);
  }
}

class ReapCIS {
  // The Standard Commerce Instruction Set (Lowercased)
  INSTRUCTIONS = {
    // Discovery & Info
    SEARCH_PRODUCTS: 'cis_search_products',
    GET_PRICE: 'cis_get_price',
    CHECK_STOCK: 'cis_check_stock',
    
    // Transaction Flow
    RESERVE_ORDER: 'cis_reserve_order',
    INIT_CHECKOUT: 'cis_init_checkout',
    CALCULATE_FEES: 'cis_calculate_fees',
    
    // Settlement & Identity
    REQUEST_PAYMENT: 'cis_request_payment',
    REQUEST_KYC: 'cis_request_kyc',
    SETTLE_PAYMENT: 'cis_settle_payment',
    
    // Fulfillment
    ALLOCATE_PICKUP: 'cis_allocate_pickup',
    TRIGGER_FULFILLMENT: 'cis_trigger_fulfillment',
    MARK_DELIVERED: 'cis_mark_delivered',
    PROCESS_RETURN: 'cis_process_return'
  };

  /**
   * ADAPTER LOGIC: Translates CIS -> Agent Native Protocol
   */
  resolveAction(cisType: string, targetAgentMetadata: any): any {
    const protocol = targetAgentMetadata.metadata.protocol || 'unknown';
    
    // 1. HANDLE x402 AGENTS
    if (protocol.includes('x402')) {
      return this.resolveX402(cisType, targetAgentMetadata);
    }

    // 2. HANDLE MCP AGENTS
    if (protocol.includes('mcp')) {
      return this.resolveMCP(cisType, targetAgentMetadata);
    }

    return { error: "Unsupported Agent Protocol" };
  }

  private resolveX402(cisType: string, agent: any): any {
    const meta = agent.metadata;
    
    switch (cisType) {
        case 'cis_get_price':
            return {
                action: 'READ_METADATA',
                key: 'maxAmountRequired',
                value: meta.maxAmountRequired,
                asset: meta.asset
            };
        case 'cis_request_payment':
            return {
                action: 'READ_METADATA',
                key: 'payTo',
                value: meta.payTo,
                network: meta.network
            };
        case 'cis_trigger_fulfillment':
            return {
                action: 'HTTP_POST',
                url: agent.endpoints.primary,
                headers: { 'Authorization': 'L402 [Token]' }
            };
        default:
            return { error: `x402 Agent does not support ${cisType}` };
    }
  }

  private resolveMCP(cisType: string, agent: any): any {
    // Basic mapping of CIS -> Common MCP Tools
    switch (cisType) {
        case 'cis_search_products':
            return { action: 'MCP_TOOL_CALL', tool: 'list_products', params: {} };
        case 'cis_init_checkout':
            return { action: 'MCP_TOOL_CALL', tool: 'create_order', params: {} };
        case 'cis_settle_payment':
            return { action: 'MCP_TOOL_CALL', tool: 'create_payment_link', params: {} };
        default:
             return { action: 'MCP_TOOL_CALL', tool: `fallback_${cisType}` };
    }
  }
}

class ReapProtocolPacketBuilder {
  private reapCIS: ReapCIS;

  constructor(reapCIS: ReapCIS) {
    this.reapCIS = reapCIS;
  }

  create(cisType: string, params: any, targetAgentData: any, coordinate: string, keyPair: any): any {
    const resolution = this.reapCIS.resolveAction(cisType, targetAgentData);
    if (resolution.error) return { error: resolution.error };

    const payload = {
        protocol: "REAP_V1",
        type: 'REAP_CIS_INSTRUCTION',
        ts: Date.now(),
        coordinate: coordinate.toString(),
        agent_id: keyPair.publicKey.toString('hex'),
        instruction: cisType,
        execution: resolution, 
        params: params 
    };

    const content = Buffer.from(JSON.stringify(payload));
    const signature = keyPair.sign(content);

    return { payload, signature: signature.toString('hex') };
  }

  getLobbyKeyPair(coordinate: string): any {
    const seed = b4a.alloc(32);
    sodium.crypto_generichash(seed, b4a.from(coordinate.toString()));

    const publicKey = b4a.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
    const secretKey = b4a.alloc(sodium.crypto_sign_SECRETKEYBYTES);
    
    sodium.crypto_sign_seed_keypair(publicKey, secretKey, seed);

    return { publicKey, secretKey }; 
  }
}

class HypercoreService extends EventEmitter {
  private reapGrid: ReapGrid;
  private reapCIS: ReapCIS;
  private packetBuilder: ReapProtocolPacketBuilder;
  private store: Corestore;
  private swarm: Hyperswarm;

  constructor() {
    super();
    this.reapGrid = new ReapGrid();
    this.reapCIS = new ReapCIS();
    this.packetBuilder = new ReapProtocolPacketBuilder(this.reapCIS);
    this.store = new Corestore('storage');
    this.swarm = new Hyperswarm();
    console.log('HypercoreService initialized');
  }

  async startAgent(coordinate: string) {
    this.emit('log', '>> [AGENT A] Online.');
    await this.store.ready();
    
    const lobbyKeys = this.packetBuilder.getLobbyKeyPair(coordinate);
    this.emit('log', `>> [LOBBY KEY] ${lobbyKeys.publicKey.toString('hex').slice(0,8)}...`);

    const lobbyCore = this.store.get({ keyPair: lobbyKeys });
    await lobbyCore.ready();

    const reapChannel = lobbyCore.registerExtension('reap-cis-v1', {
        encoding: 'json',
        onmessage: (message, peer) => {
            const packet = message;
            const payload = packet.payload;

            if (payload && payload.type === 'REAP_CIS_INSTRUCTION') {
                this.emit('log', `\n>> [INBOX] CIS Instruction Received!`);
                this.emit('log', `>> [FROM] Agent ID: ${payload.agent_id.slice(0,8)}...`);
                this.emit('log', `>> [CMD]  ${payload.instruction}`);
                
                let resultData = null;
                
                if (payload.execution.action === 'READ_METADATA') {
                    this.emit('log', `>> [ACT]  Reading Data Key: ${payload.execution.key}`);
                    resultData = { 
                        value: "5000", 
                        asset: "USDC", 
                        network: "base" 
                    };
                }

                if (resultData) {
                    const response = {
                        type: 'REAP_CIS_RESPONSE',
                        original_id: payload.ts,
                        result: resultData
                    };

                    reapChannel.send(response, peer);
                    this.emit('log', `>> [TX]   Sent Response to Agent B.`);
                }
            }
        }
    });

    const topic = this.reapGrid.getTopic(coordinate);
    this.swarm.join(topic);

    this.swarm.on('connection', socket => {
        this.emit('log', '>> [NET] Secured Connection Established.');
        this.store.replicate(socket);
        lobbyCore.replicate(socket);
    });
  }

  async startManager(coordinate: string, privateKey: string, targetMetadata: any) {
    this.emit('log', '>> [AGENT B] Booting Manager...');
    
    const reapClient = new ReapClient(
        privateKey,
        "https://sepolia.base.org",
        "https://base2.api.reap.deals"
    );
    await new Promise(r => setTimeout(r, 1000));
    try { await reapClient.registerIdentity(); } catch (e) {}

    const HOLOCRON_ADDRESS = "0x2cEC5Bf3a0D3fEe4E13e8f2267176BdD579F4fd8";
    const HOLOCRON_ABI = [
      "function checkExistence(uint256 _c) view returns (bool)",
      "function stock(uint256 _c) external"
    ];
    const provider = new ethers.JsonRpcProvider("https://avalanche-fuji.drpc.org");
    const wallet = new ethers.Wallet(privateKey, provider);
    const holocron = new ethers.Contract(HOLOCRON_ADDRESS, HOLOCRON_ABI, wallet);

    await this.store.ready();
    const core = this.store.get({ name: 'manager-identity' });
    await core.ready();

    const keyPair = {
        publicKey: core.key,
        sign: (buf) => {
            const signature = b4a.alloc(sodium.crypto_sign_BYTES);
            sodium.crypto_sign_detached(signature, buf, core.keyPair.secretKey);
            return signature;
        }
    };

    const lobbyKeys = this.packetBuilder.getLobbyKeyPair(coordinate);
    const lobbyCore = this.store.get({ keyPair: lobbyKeys });
    await lobbyCore.ready();
    
    const reapChannel = lobbyCore.registerExtension('reap-cis-v1', {
        encoding: 'json',
        onmessage: async (msg, peer) => { 
            if (msg.type === 'REAP_CIS_RESPONSE') {
                const rawVal = parseInt(msg.result.value);
                const readable = rawVal / 1000000; 

                this.emit('log', `\n>> [REPLY] Received Offer from Agent A`);
                this.emit('log', `>> [DATA]  Price: $${readable} ${msg.result.asset}`);
                
                try {
                    const bigIntId = BigInt(coordinate);
                    const hexId = "0x" + bigIntId.toString(16);

                    this.emit('log', `>> [CHAIN] Ensuring ID is Indexed: ${hexId.slice(0,10)}...`);

                    const exists = await holocron.checkExistence(bigIntId);
                    
                    if (!exists) {
                        this.emit('log', `>> [CHAIN] ID not found. Indexing now...`);
                        const tx = await holocron.stock(bigIntId);
                        this.emit('log', `>> [TX]    Indexing TX: ${tx.hash}`);
                        await tx.wait();
                        this.emit('log', `>> [CHAIN] Indexing Confirmed.`);
                    } else {
                        this.emit('log', `>> [CHAIN] ID already indexed. Skipping gas.`);
                    }

                    this.emit('log', `>> [CASH]  Initiating Purchase...`);
                    const receipt = await reapClient.buyProduct(hexId);
                    
                    if (receipt) {
                        this.emit('log', `>> [DONE]  Settlement Complete!`);
                        this.emit('log', `>> [TX]    Hash: ${receipt.hash}`);
                    }
                } catch (err) {
                    this.emit('log', `>> [ERR]   Settlement Failed: ${err.message}`);
                    if (err.message.includes("525")) {
                         this.emit('log', "Note: 525 usually means the Builder API couldn't verify the item exists yet. Wait a moment and try again.");
                    }
                }
            }
        }
    });

    lobbyCore.on('peer-add', (peer) => {
        this.emit('log', ">> [NET] Handshake Complete.");
        setTimeout(() => {
            this.emit('log', ">> [TX] Broadcasting CIS Request...");
            const packet = this.packetBuilder.create(
                this.reapCIS.INSTRUCTIONS.GET_PRICE, 
                {}, 
                targetMetadata, 
                coordinate, 
                keyPair
            );
            reapChannel.broadcast(packet);
        }, 500);
    });

    const topic = this.reapGrid.getTopic(coordinate);
    this.swarm.join(topic);
    
    this.swarm.on('connection', (socket) => {
        this.store.replicate(socket);
        lobbyCore.replicate(socket);
    });
  }
}

export const hypercoreService = new HypercoreService();
