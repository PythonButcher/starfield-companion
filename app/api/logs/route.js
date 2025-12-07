import { NextResponse } from 'next/server';
import { createLog, getAllLogs } from '../../../lib/logs';

export async function GET() {
  const logs = await getAllLogs();
  return NextResponse.json(logs);
}

export async function POST(request) {
  const body = await request.json();
  const title = body.title;
  const planetName = body.planetName || body.planet_name || body.planet;
  const rawNotes = body.rawNotes || body.raw_notes || body.notes;
  const aiNarrative = body.aiNarrative || body.ai_narrative || body.narrative;

  if (!title || !planetName || !rawNotes || !aiNarrative) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const newLog = await createLog({ title, planetName, rawNotes, aiNarrative });
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
