import { EventEmitter } from 'events';

// Point to one of your Backbone Nodes
const ANCHOR_API = 'https://reapnode.reap.deals'; 
const ANCHOR_WS = 'ws://34.143.181.65:3001';

class HypercoreService extends EventEmitter {
  private ws: WebSocket | null = null;
  private isConnected = false;

  constructor() {
    super();
    this.connectWS();
  }

  private connectWS() {
    console.log("🔌 Connecting to Mesh Anchor...");
    this.ws = new WebSocket(ANCHOR_WS);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.emit('log', '>> [NET] Connected to Backbone Anchor.');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        // Log incoming messages from the Mesh
        if (msg.type === 'REAP_CIS_RESPONSE') {
            const res = msg.result;
            this.emit('log', `>> [REPLY] ${res.note || 'Data Received'}`);
            if (res.value) {
                this.emit('log', `>> [DATA] Price: $${parseInt(res.value)/1000000} ${res.asset}`);
            }
        }
      } catch (e) { console.error(e); }
    };
  }

  // COMMAND 1: START AGENT (Tell Anchor to join)
  async startAgent(coordinate: string) {
    this.emit('log', `>> [CMD] Signaling Anchor to join ${coordinate.slice(0,10)}...`);
    
    try {
        await fetch(`${ANCHOR_API}/api/anchor/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinate })
        });
        this.emit('log', `>> [NET] Anchor Joined. Waiting for peers...`);
    } catch (e: any) {
        this.emit('log', `>> [ERR] Anchor Failed: ${e.message}`);
    }
  }

  // COMMAND 2: START MANAGER (Tell Anchor to send a request)
  async startManager(coordinate: string, instruction: string = 'cis_get_price') {
    this.emit('log', `>> [TX] Broadcasting ${instruction}...`);
    
    try {
        await fetch(`${ANCHOR_API}/api/anchor/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                coordinate, 
                instruction 
            })
        });
    } catch (e: any) {
        this.emit('log', `>> [ERR] Broadcast Failed: ${e.message}`);
    }
  }
}

export const hypercoreService = new HypercoreService();

