import { incrementOpenCount, readOpenCount } from '@/server/open-counter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

function unavailable() {
  return Response.json(
    { error: 'counter-unavailable' },
    { status: 503, headers },
  );
}

export async function GET() {
  try {
    return Response.json({ count: await readOpenCount() }, { headers });
  } catch {
    return unavailable();
  }
}

export async function POST() {
  try {
    return Response.json({ count: await incrementOpenCount() }, { headers });
  } catch {
    return unavailable();
  }
}
