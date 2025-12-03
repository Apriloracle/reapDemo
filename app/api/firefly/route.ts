import { NextResponse } from 'next/server';

const FIREFLY_API_URL = "http://35.224.41.251:9001/api/v1/namespaces/default/events";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');  // Changed from 'after' to 'skip'

    const params = new URLSearchParams({
      type: 'blockchain_event_received',
      fetchreferences: 'true',
      limit: limit || '50',
      sort: 'sequence',
    });

    if (skip) {
      params.append('skip', skip);  // Use skip instead of after
    }

    const response = await fetch(`${FIREFLY_API_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Firefly Error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Firefly proxy error:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
