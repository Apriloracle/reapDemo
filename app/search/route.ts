import { NextResponse } from 'next/server';

// ==========================
// POST Handler – Handles both Fixed Price Discovery and Paid Execution
// ==========================
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');

  // --- SCENARIO 1: No Authorization Header (Probe for Fixed Price) ---
  // A client like x402scan is asking for the price *before* the user has searched.
  // We will immediately return a manifest with our fixed price of $0.01.
  // We NO LONGER make an external API call here.
  if (!authHeader) {
    
    // Define the manifest with a hardcoded price.
    // $0.01 in USDC (6 decimals) is 10,000 base units.
    const maxAmountRequired = '10000';

    const x402spec = {
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: 'base',
          asset: 'USDC',
          maxAmountRequired, // Use the fixed price
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

    // Return the 402 Payment Required response with the fixed price manifest.
    return new NextResponse(JSON.stringify(x402spec), {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
      },
    });
  }

  // --- SCENARIO 2: Authorization Header IS Present (Paid Request) ---
  // The client has paid the $0.01 fee and is now making the actual search request.
  try {
    // SECURITY: You must validate the `authHeader` token here to confirm payment.
    
    const { query } = await request.json();
    if (!query) {
      return new NextResponse(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // === Execute the actual search logic ===
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

    // === Return the final data with a 200 OK status ===
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
// GET Handler – Manifest Discovery (Remains the same)
// ==========================
export async function GET() {
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
          input: { /* ... */ },
          output: { /* ... */ },
        },
        extra: { /* ... */ },
      },
    ],
    meta: { /* ... */ },
  };

  return new NextResponse(JSON.stringify(manifest), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': 'true',
    },
  });
}
