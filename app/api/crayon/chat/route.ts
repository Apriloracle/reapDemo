// app/api/crayon/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ShoppingContext {
  cart: Record<string, any>;
  wishlist: Record<string, any>;
  recentSearches: string[];
  walletAddress?: string;
}

interface OrchestrationConfig {
  chains: string[];
  enableWeb3: boolean;
  walletRequired: boolean;
  features: {
    priceComparison: boolean;
    multiChainSearch: boolean;
    gasEstimation?: boolean;
  };
}

interface RequestBody {
  threadId: string;
  messages: Message[];
  context: ShoppingContext;
  orchestrationConfig: OrchestrationConfig;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { threadId, messages, context, orchestrationConfig } = body;

    // Convert to DeepSeek format
    const deepseekMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content
    }));

    // System prompt with shopping context
    const systemMessage: Message = {
      role: "system",
      content: `You are a Web3 shopping assistant helping users find NFTs, tokens, and deals across multiple blockchains.

Current Shopping Context:
- Cart items: ${Object.keys(context.cart).length}
- Wishlist items: ${Object.keys(context.wishlist).length}
- Recent searches: ${context.recentSearches.join(', ') || 'none'}
- Wallet: ${context.walletAddress ? 'connected' : 'not connected'}

You can help with:
- Searching NFTs across ${orchestrationConfig.chains.join(', ')}
- Comparing prices across marketplaces
- Checking availability
- Estimating gas costs
- Managing cart and wishlist

Be helpful, concise, and focus on finding the best deals for users.`
    };

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemMessage, ...deepseekMessages],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    // Stream response back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

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

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
