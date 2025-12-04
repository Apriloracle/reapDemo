import { NextRequest, NextResponse } from 'next/server';
import registryClient from '../../../src/services/RegistryService';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 3 } = await request.json();
    
    const searchResults = await registryClient.search({
      q: query,
      limit,
      verified: true,
    });
    
    return NextResponse.json(searchResults);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
