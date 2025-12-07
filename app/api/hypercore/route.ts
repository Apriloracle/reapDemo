import { NextResponse } from 'next/server';

// Hardcoded server address - change this to your server IP
const HYPERCORE_SERVER = 'http://34.126.134.226:3001';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward request to Hypercore server
    const response = await fetch(`${HYPERCORE_SERVER}/api/agents/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to connect to Hypercore server' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Forward status request
    const response = await fetch(`${HYPERCORE_SERVER}/api/status`);
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Hypercore server unavailable', active: false },
      { status: 503 }
    );
  }
}
