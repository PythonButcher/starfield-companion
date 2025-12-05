import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ narrative: 'AI processing... [MOCK RESPONSE]' });
}
