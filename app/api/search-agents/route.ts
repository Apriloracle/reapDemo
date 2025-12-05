import { NextRequest, NextResponse } from 'next/server';
import registryClient from '../../../src/services/RegistryService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = 'customer support', limit = 40, registry = 'pulsemcp' } = body;
    
    // Search with both query and registry
    const searchResults = await registryClient.search({
      q: query,
      limit,
      registry, // Add registry parameter
    });
    
    console.log('Search results:', searchResults);
    
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
