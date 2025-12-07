import { NextRequest } from 'next/server';

let hypercoreService: any = null;

async function getHypercoreService() {
  if (!hypercoreService) {
    const module = await import('@/services/HypercoreService');
    hypercoreService = module.hypercoreService;
  }
  return hypercoreService;
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const service = await getHypercoreService();
      
      const logHandler = (log: string) => {
        const data = `data: ${JSON.stringify({ log })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Listen to log events
      service.on('log', logHandler);

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: '>> Connected to log stream' })}\n\n`));

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        service.off('log', logHandler);
        controller.close();
      });
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
