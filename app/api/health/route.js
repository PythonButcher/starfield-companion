import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'systems_nominal' });
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
