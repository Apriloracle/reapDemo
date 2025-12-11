import { NextResponse } from 'next/server';

// Define CORS headers to be reused in all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Allows any origin. For production, you might want to restrict this.
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Define the Manifest for this new endpoint
const MANIFEST = {
  x402Version: 1,
  accepts: [
    {
      scheme: 'exact',
      network: 'base',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Using the same asset as /search for consistency
      maxAmountRequired: '10000', // Fixed price of $0.01 for now
      resource: 'https://reap.deals/agents',
      description: 'Get agent search results from the agent explorer.',
      mimeType: 'application/json',
      payTo: '0x31ab637bd325b4bf5018b39dd155681d03348189', // Using the same payment address
      maxTimeoutSeconds: 180, // Increased timeout for agent processing
      outputSchema: {
        input: {
          type: 'http',
          method: 'POST',
          bodyType: 'json',
          bodyFields: {
            query: {
              type: 'string',
              required: false,
              description: 'Agent name or keyword to search for.',
            },
            limit: {
              type: 'number',
              required: false,
              description: 'The maximum number of results to return.',
            },
            registry: {
              type: 'string',
              required: false,
              description: 'The registry to search in.',
            },
          },
        },
        output: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              createdAt: { type: 'string' },
              description: { type: 'string' },
              endpoints: { type: 'string' },
              metadata: { type: 'string' },
              name: { type: 'string' },
              profile: { type: 'string' },
              registry: { type: 'string' },
              uaid: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
      extra: {
        provider: 'REAP',
        category: 'discovery',
        version: '1.0.0',
        source: 'agent-worker',
      },
    },
  ],
  meta: {
    name: 'Agent Search',
    description: 'Real-time agent search',
    keywords: ['agent', 'search', 'discovery'],
    version: '1.0.0',
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
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }

  // --- SCENARIO 2: Authorization Header IS Present (Paid Request) ---
  // SECURITY: You must validate the `authHeader` token here to confirm payment.
  
  try {
    const body = await request.json();
    const { query = '', limit = 40, registry } = body;

    const agentEndpoint = 'http://localhost:8081'; // URL of the new agent search server
    
    const response = await fetch(agentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit, registry }),
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
