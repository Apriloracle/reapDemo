import { invoke } from './mcp-engine';

export class HypercoreBridge {
  private ws: WebSocket | null = null;

  constructor() {
    this.connect();
  }

  connect(gatewayUrl: string = 'ws://localhost:3001') {
    // NOTE: Using a placeholder URL until the actual Micro-Gateway endpoint is available.
    this.ws = new WebSocket(gatewayUrl);

    this.ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'INBOUND_MESH_REQUEST') {
        console.log(`🔔 Mesh asked to run: ${msg.tool}`);
        
        try {
          const result = await invoke(msg.tool, msg.params);

          this.ws?.send(JSON.stringify({
            type: 'MCP_TOOL_RESULT',
            original_request_id: msg.request_id,
            result: result
          }));
          
        } catch (e) {
          console.error("Tool execution failed:", e);
        }
      }
    };

    this.ws.onopen = () => {
      console.log("✅ Connected to Micro-Gateway.");
    };

    this.ws.onclose = () => {
      console.log("🔌 Disconnected from Micro-Gateway. Reconnecting...");
      setTimeout(() => this.connect(gatewayUrl), 3000);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };
  }
}

// Singleton Instance
export const hypercoreBridge = new HypercoreBridge();
