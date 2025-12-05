import { NextResponse } from 'next/server';
import { initialLogs } from '../../../lib/data/initialLogs';

let logs = [...initialLogs];

export async function GET() {
  return NextResponse.json(logs);
}

export async function POST(request) {
  const payload = await request.json();
  const nextId = logs.length > 0 ? Math.max(...logs.map((log) => log.id)) + 1 : 1;

  const newLog = {
    id: nextId,
    title: payload.title?.trim() || 'Untitled Log',
    planet: payload.planet?.trim() || 'Unknown',
    content: payload.notes?.trim() || payload.content?.trim() || '',
    date: new Date().toISOString(),
  };

  logs = [newLog, ...logs];
  return NextResponse.json(newLog, { status: 201 });
}
