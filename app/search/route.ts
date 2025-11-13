import { NextResponse } from 'next/server';

// ==========================
// POST Handler – Executes Product Search
// ==========================
export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query) {
    return new NextResponse(
      JSON.stringify({ error: 'Query is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // === 1. Fetch from your Cloud Run product search microservice ===
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

    // === 2. Convert price to USDC smallest units ===
    const priceString = firstProduct.price || '';
    const price = parseFloat(priceString.replace(/[^0-9.-]+/g, ''));
    const maxAmountRequired = Math.ceil(price * 1_000_000).toString(); // 1 USDC = 1,000,000 "wei"-like units

    // === 3. Build x402 dynamic manifest payload ===
    const x402spec = {
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: 'base',
          asset: 'USDC',
          maxAmountRequired,
          resource: `https://reap.deals/search?q=${encodeURIComponent(query)}`,
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
            note: 'Dynamic pricing and product search via REAP verified endpoint.',
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

    // === 4. Return with 402 payment required header ===
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

// ==========================
// GET Handler – Manifest Discovery for Browsers & x402scan
// ==========================
export async function GET() {
  const manifest = {
    x402Version: 1,
    accepts: [
      {
        scheme: 'exact',
        network: 'base',
        asset: 'USDC',
        maxAmountRequired: '100000',
        resource: 'https://reap.deals/search',
        description: 'Search for real-time product pricing and availability.',
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

  return NextResponse.json(manifest, { status: 200 });
}


