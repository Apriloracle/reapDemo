import { NextResponse } from 'next/server';
import { hypercoreService } from '@/services/HypercoreService';

export async function POST(request: Request) {
  const body = await request.json();
  const { type, coordinate, privateKey, targetMetadata } = body;

  if (type === 'agent') {
    if (!coordinate) {
      return NextResponse.json({ error: 'Missing coordinate' }, { status: 400 });
    }
    hypercoreService.startAgent(coordinate);
    return NextResponse.json({ message: 'Agent started' });
  }

  if (type === 'manager') {
    if (!coordinate || !privateKey || !targetMetadata) {
      return NextResponse.json({ error: 'Missing coordinate, privateKey, or targetMetadata' }, { status: 400 });
    }
    hypercoreService.startManager(coordinate, privateKey, targetMetadata);
    return NextResponse.json({ message: 'Manager started' });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
