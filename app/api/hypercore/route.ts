import { NextResponse } from 'next/server';

// Force dynamic rendering so it doesn't cache
export const dynamic = 'force-dynamic';

// ⭐ POINT TO YOUR NEW ANCHOR SERVER
const HYPERCORE_SERVER = 'http://34.124.252.96:3001';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Determine Intent based on Body
    // If body has "coordinate" but no "instruction", it's a JOIN request
    // If body has "instruction", it's an INTERACT request
    
    let endpoint = '/api/anchor/join'; // Default
    
    if (body.instruction) {
        endpoint = '/api/anchor/interact';
    }

    console.log(`[NextProxy] Forwarding to ${endpoint}...`);

    const response = await fetch(`${HYPERCORE_SERVER}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    // Handle Server Errors
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anchor Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("[NextProxy] Error:", error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to Hypercore Anchor' },
      { status: 500 }
    );
  }
}

// STATUS CHECK
export async function GET(request: Request) {
  try {
    // We don't have a dedicated /status endpoint in the new Anchor yet, 
    // but we can try to hit the root or add a lightweight check.
    // For now, let's assume if we can reach it, it's good.
    const response = await fetch(`${HYPERCORE_SERVER}/`); 
    // Note: If you haven't added a GET / route to HypercoreAnchor.js, 
    // you might want to add: app.get('/', (req, res) => res.json({status: 'online'}));
    
    if(response.ok) {
        return NextResponse.json({ active: true, mode: 'anchor' });
    } else {
        throw new Error("Anchor Unreachable");
    }
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Hypercore Anchor unavailable', active: false },
      { status: 503 }
    );
  }
}
