import { NextResponse } from 'next/server';
import { getUniverseSystems } from '../../../lib/universe';

export async function GET() {
  try {
    const systems = getUniverseSystems();
    return NextResponse.json(systems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load universe data' }, { status: 500 });
  }
}
