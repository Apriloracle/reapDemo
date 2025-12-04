import { NextRequest, NextResponse } from 'next/server';
import registryClient from '../../../src/services/RegistryService';

export async function POST(request: NextRequest) {
  try {
    const { limit = 20 } = await request.json();
    
    // Just get all agents with empty query
    const searchResults = await registryClient.search({
      q: '',
      limit,
    });
    
    return NextResponse.json(searchResults);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        hits: []
      },
      { status: 500 }
    );
  }
}
