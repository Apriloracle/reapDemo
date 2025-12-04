import { NextRequest, NextResponse } from 'next/server';
import registryClient from '../../../src/services/RegistryService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registry = 'coinbase-x402-bazaar', limit = 10 } = body;
    
    // Use registry filter since search is broken
    const searchResults = await registryClient.search({
      q: '', // Empty query since keyword search doesn't work
      limit,
      filter: {
        registries: [coinbase-x402-bazaar] // Filter by registry instead
      }
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
