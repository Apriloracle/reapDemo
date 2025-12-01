import { NextResponse } from 'next/server';

const FIREFLY_API_URL = "http://35.224.41.251/api/v1/namespaces/default/apis/base8004indexV2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listener = searchParams.get('listener');
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');
    const sort = searchParams.get('sort');

    const params = new URLSearchParams({
      listener: listener || '',
      limit: limit || '50',
      skip: skip || '0',
      sort: sort || 'timestamp',
    });

    const response = await fetch(`${FIREFLY_API_URL}/blockchainEvents?${params}`);

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
