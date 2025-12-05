import { NextRequest, NextResponse } from 'next/server';
import registryClient from '../../../src/services/RegistryService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = '', limit = 40, registry } = body;
    
    console.log('Received params:', { query, limit, registry });
    
    const searchParams: any = {
      q: query,
      limit,
    };
    
    if (registry) {
      searchParams.registries = registry;
    }
    
    try {
      // Try using the SDK first
      const searchResults = await registryClient.search(searchParams);
      return NextResponse.json(searchResults);
    } catch (sdkError: any) {
      // If SDK fails due to validation error, fallback to direct API call
      console.log('SDK failed, using direct API call:', sdkError.message);
      
      const url = new URL('https://hol.org/registry/api/v1/agents/search');
      url.searchParams.append('q', query);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('page', '1');
      
      if (registry) {
        url.searchParams.append('registries', registry);
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    }
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
