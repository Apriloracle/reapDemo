// src/lib/hypercore-client.ts
// Client that calls Next.js API routes (which proxy to Hypercore server)

class HypercoreClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  
  // Connect to Server-Sent Events for real-time logs
  connect() {
    if (this.eventSource?.readyState === EventSource.OPEN) return;
    
    this.eventSource = new EventSource('/api/hypercore/logs');
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource?.close();
      // Auto-reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
  
  // Start an agent
  async startAgent(coordinate: string) {
    const response = await fetch('/api/hypercore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'agent', 
        coordinate 
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start agent');
    }
    
    return response.json();
  }
  
  // Start a manager
  async startManager(coordinate: string, privateKey: string, targetMetadata: any) {
    const response = await fetch('/api/hypercore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'manager', 
        coordinate,
        privateKey,
        targetMetadata
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start manager');
    }
    
    return response.json();
  }
  
  // Get server status
  async getStatus() {
    try {
      const response = await fetch('/api/hypercore');
      return response.json();
    } catch (error) {
      return { active: false, sessions: 0, peers: 0 };
    }
  }
  
  // Event listener system
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return cleanup function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
  
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

// Export singleton instance
export const hypercoreClient = new HypercoreClient();
