import { NextResponse } from 'next/server';
import { adminSupabase } from '../../../../lib/supabase';
import { isAdmin } from '../../../../lib/auth';

const schemas: Record<string, string[]> = {
  profile: ['name','title','bio','email','phone','location','avatar_url','resume_url','github_url','linkedin_url','telegram_url'],
  skills: ['name','category','level','is_public','display_order'],
  experience: ['company','role','description','location','start_date','end_date','technologies','is_current','is_public','display_order'],
  certificates: ['title','issuer','issue_date','credential_id','credential_url','image_url','description','is_public','display_order'],
  contact_messages: ['name','email','message','read'],
};

const orderBy: Record<string, { column: string; ascending: boolean }[]> = {
  profile: [{ column: 'updated_at', ascending: false }],
  skills: [{ column: 'display_order', ascending: true }, { column: 'created_at', ascending: false }],
  experience: [{ column: 'display_order', ascending: true }, { column: 'created_at', ascending: false }],
  certificates: [{ column: 'display_order', ascending: true }, { column: 'created_at', ascending: false }],
  contact_messages: [{ column: 'created_at', ascending: false }],
};

function cleanRow(table: string, row: Record<string, any>) {
  const allowed = new Set(schemas[table] || []);
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(row || {})) {
    if (allowed.has(key)) cleaned[key] = row[key];
  }
  return cleaned;
}

async function getClient() {
  if (!isAdmin()) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!adminSupabase) return { error: NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server.' }, { status: 500 }) };
  return { client: adminSupabase };
}

export async function GET(req: Request) {
  const { client, error } = await getClient();
  if (error) return error;
  const table = new URL(req.url).searchParams.get('table') || '';
  if (!schemas[table]) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

  let query = client.from(table).select('*');
  for (const o of orderBy[table]) query = query.order(o.column, { ascending: o.ascending });
  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(req: Request) {
  const { client, error } = await getClient();
  if (error) return error;
  try {
    const body = await req.json();
    const table = body?.table;
    if (!schemas[table]) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    const row = cleanRow(table, body?.row || {});
    if (table === 'profile') {
      const { data: existing } = await client.from('profile').select('id').limit(1).maybeSingle();
      if (existing?.id) {
        const { data, error: dbError } = await client.from('profile').update(row).eq('id', existing.id).select().single();
        if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
        return NextResponse.json({ data });
      }
    }
    const { data, error: dbError } = await client.from(table).insert(row).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request.' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const { client, error } = await getClient();
  if (error) return error;
  try {
    const body = await req.json();
    const table = body?.table;
    const id = body?.id;
    if (!schemas[table] || !id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const row = cleanRow(table, body?.row || {});
    const { data, error: dbError } = await client.from(table).update(row).eq('id', id).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { client, error } = await getClient();
  if (error) return error;
  try {
    const body = await req.json();
    const table = body?.table;
    const id = body?.id;
    if (!schemas[table] || !id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const { error: dbError } = await client.from(table).delete().eq('id', id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request.' }, { status: 400 });
  }
}
