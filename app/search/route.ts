import { NextResponse } from 'next/server';

// ==========================
// POST Handler – Handles both Payment Discovery and Paid Execution
// ==========================
export async function POST(request: Request) {
  // x402 protocol distinguishes between a "probe" request (to get payment info)
  // and a "paid" request (which includes proof of payment).
  // We check for the 'Authorization' header to tell them apart.
  const authHeader = request.headers.get('Authorization');

  // --- SCENARIO 1: No Authorization Header ---
  // This is a "probe" request from a client (like x402scan) asking *how* to pay.
  // We must immediately return the 402 manifest.
  if (!authHeader) {
    try {
      // We still need the query to create a dynamic price for the manifest.
      // Note: x402scan might send a dummy query during its check.
      // If the body is empty, we fall back to a default value.
      let query = 'product';
      try {
        const body = await request.json();
        query = body.query || 'product';
      } catch (e) {
        // Ignore error if body is empty, just use the default query.
      }
      
      // === 1. Fetch from Cloud Run service to get a price for the manifest ===
      const response = await fetch(
        'https://shoppingapicaller-50775725716.asia-southeast1.run.app',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query, gl: 'us' }),
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch initial price for manifest');
        // Fallback to a default price if the initial fetch fails
        return buildErrorResponse(500, 'Could not retrieve pricing information.');
      }

      const results = await response.json();
      const firstProduct = results.shopping?.[0];

      if (!firstProduct || !firstProduct.price) {
          // If no product is found for the dummy query, we can use a default/estimated price.
          console.warn('No product found for initial query, using default price for manifest.');
      }
      
      // === 2. Convert price to USDC base units (or use a default) ===
      const priceString = firstProduct?.price || '0.01'; // Default to 1 cent
      const price = parseFloat(priceString.replace(/[^0-9.-]+/g, ''));
      const maxAmountRequired = Math.ceil(price * 1_000_000).toString();

      // === 3. Build the x402 manifest ===
      const x402spec = {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'base',
            asset: 'USDC',
            maxAmountRequired, // Use the dynamically fetched price
            resource: `https://reap.deals/search`,
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

      // === 4. Return the 402 Payment Required response ===
      // This is what x402scan expects, and it will fix the red 'X'.
      return new NextResponse(JSON.stringify(x402spec), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Required': 'true',
        },
      });

    } catch (error) {
        console.error('Error building x402 manifest:', error);
        return buildErrorResponse(500, 'Internal Server Error during manifest creation.');
    }
  }

  // --- SCENARIO 2: Authorization Header IS Present ---
  // This is a "paid" request. The client has paid and is now requesting the resource.
  try {
    //
    // >>> IMPORTANT SECURITY STEP <<<
    // You MUST validate the `authHeader` token here to confirm payment.
    // This logic depends on your specific L402 implementation.
    // e.g., `const isValid = await validatePaymentToken(authHeader);`
    // If it's not valid, return a 401 Unauthorized or 403 Forbidden.
    //
    
    const { query } = await request.json();
    if (!query) {
      return buildErrorResponse(400, 'Query is required for a paid request.');
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
    return buildErrorResponse(500, 'Internal Server Error');
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
        maxAmountRequired: '10000', // A static default/example price
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

  // Return a 402 Payment Required with correct headers for x402scan discovery
  return new NextResponse(JSON.stringify(manifest), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': 'true',
    },
  });
}


// A helper function for consistent error responses
function buildErrorResponse(status: number, message: string) {
  return new NextResponse(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
