import { NextRequest, NextResponse } from 'next/server';
import registryClient from '../../../src/services/RegistryService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = '', limit = 40, registry } = body; // Remove default for registry
    
    console.log('Received params:', { query, limit, registry }); // Debug log
    
    // Build search params
    const searchParams: any = {
      q: query,
      limit,
    };
    
    // Only add registry if it's provided
    if (registry) {
      searchParams.registry = registry;
    }
    
    const searchResults = await registryClient.search(searchParams);
    
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
