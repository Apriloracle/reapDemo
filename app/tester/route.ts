import { NextResponse } from 'next/server';

// Define CORS headers to be reused in all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Payment-Proof, X-Paying-Agent, X-Request-Sponsor',
};

// --- CONFIGURATION ---
const UNIVERSAL_ADDRESS = "0xC1a9a0f9B0e4BC40AF353D108227d40B52Eb1248"; // Your Mainnet Diamond
const PRICE_USDC_SMALL = "10000"; // 0.01 USDC (6 decimals)

// Define the Manifest (The "Menu" for Agents)
const MANIFEST = {
  x402Version: 1,
  
  // 1. INSTRUCTIONS (UX for Agents)
  instructions: {
      human: "Payment required. You can pay on Base or Celo. After paying, retry this POST request with the 'X-Payment-Proof' header. You MUST include the 'query' field in the JSON body.",
      machine_readable: {
          required_headers: ["X-Payment-Proof", "X-Paying-Agent"],
          required_body_fields: ["query"]
      }
  },

  // 2. SPONSORSHIP (Free Tier)
  sponsorship: {
      available: false,
      message: "Low on funds? Retry request with header 'X-Request-Sponsor: true' to apply for a free query.",
      conditions: "One free query per agent address per day."
  },

  // 3. PAYMENT OPTIONS (Multi-Chain)
  accepts: [
    {
      scheme: 'exact',
      network: 'base',
      chainId: 8453,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      maxAmountRequired: PRICE_USDC_SMALL,
      resource: 'reap-ai-v1', // The SKU
      description: 'Get personalized product search results (Base Settlement).',
      payTo: UNIVERSAL_ADDRESS,
      mimeType: 'application/json',
      outputSchema: getSchemaDefinition() // Helper function below
    },
    {
      scheme: 'exact',
      network: 'celo',
      chainId: 42220,
      asset: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', // Celo USDC
      maxAmountRequired: PRICE_USDC_SMALL,
      resource: 'reap-ai-v1',
      description: 'Get personalized product search results (Celo Settlement).',
      payTo: UNIVERSAL_ADDRESS,
      mimeType: 'application/json',
      outputSchema: getSchemaDefinition()
    }
  ],
  meta: {
    name: 'Personalized Discovery Search',
    description: 'Real-time, personalized product search',
    keywords: ['shopping', 'deals', 'price', 'search', 'personalized', 'discovery'],
    version: '2.0.0',
  },
};

// Helper to keep manifest clean
function getSchemaDefinition() {
  return {
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
      type: 'array',
      items: {
        type: 'object',
        properties: {
          asin: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' },
          priceDisplay: { type: 'string' },
          rating: { type: 'number' },
          ratingCount: { type: 'number' },
          source: { type: 'string' },
          imageUrl: { type: 'string' },
          link: { type: 'string' },
          valueScore: { type: 'number' },
          deal: { type: 'string' },
        },
      },
    },
  };
}


// ==========================
// OPTIONS Handler for CORS Preflight
// ==========================
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}


// ==========================
// GET Handler – Returns the 402 Manifest
// ==========================
export async function GET() {
  return new NextResponse(JSON.stringify(MANIFEST), {
    status: 402, // Payment Required
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'X-Payment-Required': 'true',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}


// ==========================
// POST Handler – The Data Gate
// ==========================
export async function POST(request: Request) {
  
  // 1. Parse Body (Required for processing)
  let query: string | undefined;
  try {
    const body = await request.json();
    query = body.query;
  } catch (e) {
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

  // 2. CHECK AUTHORIZATION (Payment or Sponsorship)
  const paymentProof = request.headers.get("X-Payment-Proof");
  const payingAgent = request.headers.get("X-Paying-Agent");
  const askForSponsor = request.headers.get("X-Request-Sponsor");

  let isAuthorized = false;

  // A. Sponsorship Path
  if (askForSponsor === 'true') {
      console.log(`🎁 Sponsorship Requested by Agent. Query: "${query}"`);
      // Optional: Add rate limiting here (e.g., Redis check on IP)
      isAuthorized = true; 
  }
  
  // B. Payment Path
  else if (paymentProof) {
      console.log(`💰 Payment Proof Received: ${paymentProof}`);
      // In a production environment, you would verify this TxHash against your Facilitator Node or RPC
      // For now, we accept the proof presence as validation (Trust but Verify later)
      isAuthorized = true;
  }

  // C. Rejection (Return 402)
  if (!isAuthorized) {
      console.log(`⛔ Access Denied. Sending 402 Manifest.`);
      return new NextResponse(JSON.stringify(MANIFEST), {
        status: 402,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'X-Payment-Required': 'true'
        },
      });
  }

  // 3. EXECUTE LOGIC (Proxy to Reap Backend)
  try {
    const agentEndpoint = 'https://productserver1.reap.deals';
    
    console.log(`🔍 Fetching products for query: "${query}"`);
    
    const response = await fetch(agentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, dataType: 'products' }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Agent server returned an error: ${response.status}`, errorBody);
      return new NextResponse(
        JSON.stringify({ error: 'The agent server returned an error.', details: errorBody }),
        { status: response.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const results = await response.json();
    console.log(`✅ Returning ${results?.length || 0} products`);
    
    return new NextResponse(JSON.stringify(results), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error proxying request to agent server:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error while contacting the agent.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}
