import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { rawNotes = '', planetName = '', title = '' } = body || {};

  const narrative = `AI processing... [MOCK RESPONSE]${title ? ` | ${title}` : ''}${planetName ? ` @ ${planetName}` : ''}`;

  return NextResponse.json({ narrative, rawNotes });
}
