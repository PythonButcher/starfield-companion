import { NextResponse } from 'next/server';
import { getUniverseSystems } from '@/lib/universe';

export async function GET() {
  const systems = getUniverseSystems();
  return NextResponse.json(systems);
}
