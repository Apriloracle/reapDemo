import { NextResponse } from 'next/server';

// --- TYPE DEFINITIONS (As requested) ---

type X402Response = {
    x402Version: number;
    error?: string;
    accepts?: Array<Accepts>;
    payer?: string;
}
  
type Accepts = {
    scheme: "exact";
    network: string; // Generalized to string to allow 'celo', though type said 'base'
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    outputSchema?: {
        input: {
            type: "http";
            method: "GET" | "POST";
            bodyType?: "json" | "form-data" | "multipart-form-data" | "text" | "binary";
            queryParams?: Record<string, FieldDef>;
            bodyFields?: Record<string, FieldDef>;
            headerFields?: Record<string, FieldDef>;
        };
        output?: Record<string, any>;
    };
    extra?: Record<string, any>;
}
    
type FieldDef = {
    type?: string;
    required?: boolean | string[];
    description?: string;
    enum?: string[];
    properties?: Record<string, FieldDef>;
}

// --- CONFIGURATION ---

const UNIVERSAL_ADDRESS = "0xC1a9a0f9B0e4BC40AF353D108227d40B52Eb1248"; 
const PRICE_USDC_SMALL = "10000"; // 0.01 USDC (6 decimals)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Payment-Proof, X-Paying-Agent, X-Request-Sponsor',
};

// Shared Metadata & Instructions (Moved to a constant to inject into 'extra')
const SHARED_META = {
    instructions: {
        human: "Payment required. You can pay on Base or Celo. After paying, retry this POST request with the 'X-Payment-Proof' header. You MUST include the 'query' field in the JSON body.",
        machine_readable: {
            required_headers: ["X-Payment-Proof", "X-Paying-Agent"],
            required_body_fields: ["query"]
        }
    },
    sponsorship: {
        available: true,
        message: "Low on funds? Retry request with header 'X-Request-Sponsor: true' to apply for a free query.",
        conditions: "One free query per agent address per day."
    },
    meta: {
        name: 'Personalized Discovery Search',
        description: 'Real-time, personalized product search',
        keywords: ['shopping', 'deals', 'price', 'search', 'personalized', 'discovery'],
        version: '2.0.0',
    }
};

// Helper to define Schema
function getSchemaDefinition() {
  return {
    input: {
      type: 'http' as const,
      method: 'POST' as const,
      bodyType: 'json' as const,
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

// --- MANIFEST CONSTRUCTION ---

const MANIFEST: X402Response = {
  x402Version: 1,
  accepts: [
    {
      scheme: 'exact',
      network: 'base',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      maxAmountRequired: PRICE_USDC_SMALL,
      resource: 'https://reap.deals/onchain',
      description: 'Get personalized product search results (Base Settlement).',
      payTo: UNIVERSAL_ADDRESS,
      mimeType: 'application/json',
      maxTimeoutSeconds: 60, // Added as per type requirement
      outputSchema: getSchemaDefinition(),
      extra: {
        chainId: 8453,
        ...SHARED_META // Contextual info moved here
      }
    },
    {
      scheme: 'exact',
      network: 'celo',
      asset: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', // Celo USDC
      maxAmountRequired: PRICE_USDC_SMALL,
      resource: 'https://reap.deals/onchain',
      description: 'Get personalized product search results (Celo Settlement).',
      payTo: UNIVERSAL_ADDRESS,
      mimeType: 'application/json',
      maxTimeoutSeconds: 60,
      outputSchema: getSchemaDefinition(),
      extra: {
        chainId: 42220,
        ...SHARED_META
      }
    }
  ]
};

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
    status: 402,
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
  
  // 1. Parse Body
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

  // 2. CHECK AUTHORIZATION
  const paymentProof = request.headers.get("X-Payment-Proof");
  const askForSponsor = request.headers.get("X-Request-Sponsor");

  let isAuthorized = false;

  // A. Sponsorship Path
  if (askForSponsor === 'true') {
      console.log(`🎁 Sponsorship Requested by Agent. Query: "${query}"`);
      isAuthorized = true; 
  }
  // B. Payment Path
  else if (paymentProof) {
      console.log(`💰 Payment Proof Received: ${paymentProof}`);
      isAuthorized = true;
  }

  // C. Rejection (Return 402 Manifest with Error context)
  if (!isAuthorized) {
      console.log(`⛔ Access Denied. Sending 402 Manifest.`);
      
      // We include the error message in the 402 response body as allowed by the type
      const responseBody: X402Response = {
          ...MANIFEST,
          error: "Payment or Sponsorship required."
      };

      return new NextResponse(JSON.stringify(responseBody), {
        status: 402,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'X-Payment-Required': 'true'
        },
      });
  }

  // 3. EXECUTE LOGIC
  try {
    const agentEndpoint = 'https://productserver1.reap.deals';
    
    console.log(`🔍 Fetching products for query: "${query}"`);
    
    const response = await fetch(agentEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, dataType: 'products' }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return new NextResponse(
        JSON.stringify({ error: 'The agent server returned an error.', details: errorBody }),
        { status: response.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const results = await response.json();
    
    return new NextResponse(JSON.stringify(results), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error proxying request:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error while contacting the agent.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}
