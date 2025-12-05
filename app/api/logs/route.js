import { NextResponse } from 'next/server';

let logs = [];
let nextId = 1;

export async function GET() {
  const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  return NextResponse.json(sorted);
}

export async function POST(request) {
  const body = await request.json();
  const timestamp = new Date().toISOString();

  const newLog = {
    id: nextId++,
    title: body?.title || '',
    planet_name: body?.planet_name || '',
    raw_notes: body?.raw_notes || '',
    ai_narrative: body?.ai_narrative || '',
    date: timestamp,
  };

  logs.push(newLog);
  return NextResponse.json(newLog, { status: 201 });
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
