import { NextResponse } from 'next/server';
import { getMe } from '@/lib/auth';
import { searchIndex } from '@/lib/pages';

export async function GET() {
  const { profile } = await getMe();
  if (!profile || !['member', 'leader', 'admin'].includes(profile.role)) return NextResponse.json([], { status: 401 });
  const seen = new Set<string>();
  const hits = (await searchIndex()).filter(h => (seen.has(h.text) ? false : (seen.add(h.text), true)));
  return NextResponse.json(hits, { headers: { 'Cache-Control': 'private, max-age=600' } });
}
