import { NextResponse } from 'next/server';
import { agentDataStore } from '../../../src/stores/AgentDataStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  const agents = Object.values(agentDataStore.getTable('agents')).filter((agent: any) => {
    return agent.name.toLowerCase().includes(query.toLowerCase());
  });

  return NextResponse.json(agents);
}
