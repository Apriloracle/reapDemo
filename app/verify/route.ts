import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming JSON body
    const body = await request.json();

    // Forward to your live server (replace with your actual server IP)
    const serverRes = await fetch('http://34.142.151.200:3111/premium/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Parse the server's response
    const serverData = await serverRes.json();

    // Return the same response to the client
    return new Response(JSON.stringify(serverData), {
      status: serverRes.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in /verify route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
