import { NextResponse } from 'next/server';
import { adminSupabase, supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Public content is read server-side. Prefer the service-role client so the
  // portfolio is not blocked by Supabase RLS after Admin updates content.
  // This key never reaches the browser.
  const client = adminSupabase ?? supabase;

  const [p, s, e, c] = await Promise.all([
    client.from('profile').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    client.from('skills').select('*').eq('is_public', true).order('display_order', { ascending: true }),
    client.from('experience').select('*').eq('is_public', true).order('display_order', { ascending: true }),
    client.from('certificates').select('*').eq('is_public', true).order('display_order', { ascending: true }),
  ]);

  const firstError = p.error || s.error || e.error || c.error;
  if (firstError) {
    return NextResponse.json(
      { error: firstError.message, profile: null, skills: [], experience: [], certificates: [] },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    {
      profile: p.data,
      skills: s.data || [],
      experience: e.data || [],
      certificates: c.data || [],
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    },
  );
}
