import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { threadId, messages, context, orchestrationConfig } = await req.json();

  // Determine the target agent endpoint based on the conversation or config
  const agentEndpoint = 'https://claim.reap.deals'; 

  try {
    const response = await fetch(agentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ threadId, messages, context, orchestrationConfig, dataType: 'products' }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Agent server returned an error: ${response.status}`, errorBody);
      return new NextResponse(
        JSON.stringify({ error: 'The agent server returned an error.', details: errorBody }),
        { status: response.status }
      );
    }

    // Assuming the agent returns a stream, we pipe it back
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error proxying request to agent server:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error while contacting the agent.' }),
      { status: 500 }
    );
  }
}
