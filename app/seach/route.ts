import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query) {
    return new NextResponse(
      JSON.stringify({ error: 'Query is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // === 1. Call the external shopping API ===
    const response = await fetch(
      'https://shoppingapicaller-50775725716.asia-southeast1.run.app',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'us' }),
      }
    );

    if (!response.ok) throw new Error('Failed to fetch search results');

    const results = await response.json();
    const firstProduct = results.shopping?.[0];

    if (!firstProduct || !firstProduct.price) {
      return new NextResponse(
        JSON.stringify({ error: 'No products found or product has no price' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // === 2. Compute required amount ===
    const priceString = firstProduct.price || '';
    const price = parseFloat(priceString.replace(/[^0-9.-]+/g, ''));
    const maxAmountRequired = Math.ceil(price * 1_000_000).toString(); // Convert to USDC "wei"

    // === 3. Construct full x402 schema ===
    const x402spec = {
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: 'base',
          asset: 'USDC',
          maxAmountRequired,
          resource: `https://reap.deals/api/search?q=${encodeURIComponent(query)}`,
          description: `Search live product prices for "${query}"`,
          mimeType: 'application/json',
          payTo: '0x31ab637bd325b4bf5018b39dd155681d03348189',
          maxTimeoutSeconds: 60,
          outputSchema: {
            input: {
              type: 'http',
              method: 'POST',
              bodyType: 'json',
              bodyFields: {
                query: {
                  type: 'string',
                  required: true,
                  description: 'Product name or keyword to search for.',
                },
              },
            },
            output: {
              product: 'string',
              price: 'string',
              image: 'string',
              vendor: 'string',
              link: 'string',
              message: 'string',
            },
          },
          extra: {
            provider: 'REAP',
            category: 'shopping',
            version: '1.0.1',
            source: 'shoppingapicaller',
          },
        },
      ],
      meta: {
        name: 'Product Search',
        description: 'Real-time product and price lookup for agents and wallets.',
        keywords: ['shopping', 'deals', 'price', 'search'],
        version: '1.0.1',
      },
    };

    // === 4. Return x402 manifest with payment requirement ===
    return new NextResponse(JSON.stringify(x402spec), {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
      },
    });
  } catch (error) {
    console.error('Error in x402 search proxy:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

