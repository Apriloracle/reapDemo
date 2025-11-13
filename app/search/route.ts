import { NextResponse } from 'next/server';

// ==========================
// POST Handler – This is correct and needs no changes.
// ==========================
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    const maxAmountRequired = '10000'; // Fixed price of $0.01

    const x402spec = {
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: 'base',
          asset: 'USDC',
          maxAmountRequired,
          resource: `https://reap.deals/search`,
          description: `Search for real-time product prices`,
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
            note: 'Fixed-price product search via REAP verified endpoint.',
          },
        },
      ],
      meta: {
        name: 'Product Search',
        description: 'Real-time product and price lookup for AI agents and wallets.',
        keywords: ['shopping', 'deals', 'price', 'search'],
        version: '1.0.1',
      },
    };

    return new NextResponse(JSON.stringify(x402spec), {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
      },
    });
  }

  // Paid request logic (this is correct)
  try {
    const { query } = await request.json();
    if (!query) {
      return new NextResponse(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(
      'https://shoppingapicaller-50775725716.asia-southeast1.run.app',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'us' }),
      }
    );

    if (!response.ok) throw new Error('Failed to fetch search results from upstream');

    const results = await response.json();

    return new NextResponse(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in paid x402 search proxy:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ==========================
// GET Handler – THE FIX IS HERE
// ==========================
export async function GET() {
  // This manifest object is now complete, which will fix the parsing error.
  const manifest = {
    x402Version: 1,
    accepts: [
      {
        scheme: 'exact',
        network: 'base',
        asset: 'USDC',
        maxAmountRequired: '10000', // Set to fixed $0.01
        resource: 'https://reap.deals/search',
        description: 'Search for real-time product prices',
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
      description: 'Real-time product and price lookup for AI agents and wallets.',
      keywords: ['shopping', 'deals', 'price', 'search'],
      version: '1.0.1',
    },
  };

  return new NextResponse(JSON.stringify(manifest), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': 'true',
    },
  });
}
