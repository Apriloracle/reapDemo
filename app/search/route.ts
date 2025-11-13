import { NextResponse } from 'next/server';

// Define CORS headers to be reused in all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Allows any origin. For production, restrict to 'https://x402scan.com'.
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Define the Manifest as a single constant to ensure consistency
const MANIFEST = {
  x402Version: 1,
  accepts: [
    {
      scheme: 'exact',
      network: 'base',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      maxAmountRequired: '10000', // Fixed price of $0.01
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


// ==========================
// OPTIONS Handler for CORS Preflight
// ==========================
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204, // No Content
    headers: CORS_HEADERS,
  });
}


// ==========================
// GET Handler – Returns the fixed-price manifest
// ==========================
export async function GET() {
  return new NextResponse(JSON.stringify(MANIFEST), {
    status: 402,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'X-Payment-Required': 'true',
    },
  });
}


// ==========================
// POST Handler – Handles both Price Discovery and Paid Execution
// ==========================
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');

  // --- SCENARIO 1: No Authorization Header (Probe for Price) ---
  if (!authHeader) {
    // Return the same manifest as the GET request
    return new NextResponse(JSON.stringify(MANIFEST), {
      status: 402,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
      },
    });
  }

  // --- SCENARIO 2: Authorization Header IS Present (Paid Request) ---
  try {
    // SECURITY: You must validate the `authHeader` token here to confirm payment.

    let query: string | undefined;
    try {
      const body = await request.json();
      query = body.query;
    } catch (e) {
      console.error("Could not parse request body as JSON:", e);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request body. Expected JSON.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!query) {
      return new NextResponse(
        JSON.stringify({ error: 'A "query" field is required in the request body.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Execute the actual search
    const response = await fetch(
      'https://shoppingapicaller-50775725716.asia-southeast1.run.app',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'us' }),
      }
    );

    if (!response.ok) {
      console.error("Upstream API fetch failed:", response.status, await response.text());
      throw new Error('Failed to fetch search results from the upstream API');
    }

    const results = await response.json();

    // Return the successful result
    return new NextResponse(JSON.stringify(results), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in paid x402 search proxy:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}
