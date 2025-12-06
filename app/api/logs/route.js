import { NextResponse } from 'next/server';
import { createLog, getAllLogs } from '../../../lib/logs';

export async function GET() {
  try {
    const logs = await getAllLogs();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, planetName, rawNotes, aiNarrative } = body;

    if (!title || !planetName) {
      return NextResponse.json({ error: 'title and planetName are required' }, { status: 400 });
    }

    const newLog = await createLog({ title, planetName, rawNotes, aiNarrative });
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
