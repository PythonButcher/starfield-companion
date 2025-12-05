import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const rawNotes = body?.raw_notes || body?.notes || '';
  const placeholderNarrative = rawNotes
    ? `AI processing log for: ${rawNotes.substring(0, 120)}...`
    : 'AI processing... [MOCK RESPONSE]';

  return NextResponse.json({ narrative: placeholderNarrative });
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
