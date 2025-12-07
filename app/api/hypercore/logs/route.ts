import { NextRequest } from 'next/server';

// Hardcoded server address
const HYPERCORE_SERVER_WS = 'ws://34.126.134.226:3001';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let ws: WebSocket | null = null;
      
      try {
        // Connect to Hypercore server WebSocket
        ws = new WebSocket(HYPERCORE_SERVER_WS);
        
        ws.onopen = () => {
          const data = `data: ${JSON.stringify({ type: 'log', message: '>> Connected to Hypercore server' })}\n\n`;
          controller.enqueue(encoder.encode(data));
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const data = `data: ${JSON.stringify(message)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            // Ignore parse errors
          }
        };
        
        ws.onerror = (error) => {
          const data = `data: ${JSON.stringify({ type: 'log', message: '>> WebSocket error' })}\n\n`;
          controller.enqueue(encoder.encode(data));
        };
        
        ws.onclose = () => {
          const data = `data: ${JSON.stringify({ type: 'log', message: '>> Disconnected from server' })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        };
        
        // Cleanup on connection close
        request.signal.addEventListener('abort', () => {
          if (ws) {
            ws.close();
          }
          controller.close();
        });
        
      } catch (error) {
        const data = `data: ${JSON.stringify({ type: 'log', message: '>> Failed to connect to Hypercore server' })}\n\n`;
        controller.enqueue(encoder.encode(data));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
