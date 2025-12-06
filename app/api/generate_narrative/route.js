import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { rawNotes, planetName } = await request.json();
    const narrative = `AI processing ${planetName ? `for ${planetName}` : ''}... [MOCK RESPONSE]${rawNotes ? ` Notes: ${rawNotes.slice(0, 50)}...` : ''}`.trim();
    return NextResponse.json({ narrative });
  } catch (error) {
    return NextResponse.json({ narrative: 'AI processing... [MOCK RESPONSE]' });
  }
}
