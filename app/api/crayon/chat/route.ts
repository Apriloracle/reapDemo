// app/api/chat/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { threadId, messages, context } = await req.json();

  // Convert to DeepSeek format
  const deepseekMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Add system prompt with shopping context
  const systemMessage = {
    role: "system",
    content: `You are a Web3 shopping assistant. 
    
Current user context:
- Cart: ${context?.cart?.length || 0} items
- Wishlist: ${context?.wishlist?.length || 0} items
- Recent searches: ${context?.recentSearches?.join(', ') || 'none'}
- Wallet: ${context?.walletAddress || 'not connected'}

Help users find products, compare prices across chains, and manage their shopping experience.`
  };

  // Call DeepSeek API
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat', // or 'deepseek-reasoner' for R1
      messages: [systemMessage, ...deepseekMessages],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  // Stream response to Crayon UI
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
