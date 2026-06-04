import { NextResponse } from 'next/server';
import { readData } from '@/lib/data';
import type { Consumer } from '@/types/user';

export function GET() {
  const consumers = readData<Consumer>('consumers.json');
  return NextResponse.json(consumers);
}
