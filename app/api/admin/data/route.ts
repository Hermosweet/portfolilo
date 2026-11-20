import { NextResponse } from 'next/server';
import { adminSupabase } from '../../../../lib/supabase';
import { isAdmin } from '../../../../lib/auth';

const allowed = new Set(['profile','skills','experience','certificates','contact_messages']);
const orderBy: Record<string, { column: string; ascending: boolean }[]> = {
  profile: [{ column: 'updated_at', ascending: false }],
  skills: [{ column: 'display_order', ascending: true }, { column: 'created_at', ascending: false }],
  experience: [{ column: 'display_order', ascending: true }, { column: 'created_at', ascending: false }],
  certificates: [{ column: 'display_order', ascending: true }, { column: 'created_at', ascending: false }],
  contact_messages: [],
};

async function getClient(){
  if(!isAdmin()) return {error:NextResponse.json({error:'Unauthorized'},{status:401})};
  if(!adminSupabase) return {error:NextResponse.json({error:'Server database key is missing'},{status:500})};
  return {client:adminSupabase};
}

export async function GET(req:Request){
  const {client,error}=await getClient(); if(error)return error;
  const table=new URL(req.url).searchParams.get('table');
  if(!table||!allowed.has(table))return NextResponse.json({error:'Invalid table'},{status:400});
  let query=client.from(table).select('*');
  for(const o of orderBy[table]) query=query.order(o.column,{ascending:o.ascending});
  const {data:rawData, error:dbError}=await query;
  const data = table==='contact_messages' ? [...(rawData||[])].sort((a:any,b:any)=>String(b.created_at||'').localeCompare(String(a.created_at||''))) : rawData;
  if(dbError)return NextResponse.json({error:dbError.message},{status:500});
  return NextResponse.json({data});
}

export async function POST(req:Request){
  const {client,error}=await getClient(); if(error)return error;
  const {table,row}=await req.json();
  if(!allowed.has(table))return NextResponse.json({error:'Invalid table'},{status:400});
  const {data,error:dbError}=await client.from(table).insert(row).select().single();
  if(dbError)return NextResponse.json({error:dbError.message},{status:500});
  return NextResponse.json({data});
}

export async function PATCH(req:Request){
  const {client,error}=await getClient(); if(error)return error;
  const {table,id,row}=await req.json();
  if(!allowed.has(table)||!id)return NextResponse.json({error:'Invalid request'},{status:400});
  const {data,error:dbError}=await client.from(table).update(row).eq('id',id).select().single();
  if(dbError)return NextResponse.json({error:dbError.message},{status:500});
  return NextResponse.json({data});
}

export async function DELETE(req:Request){
  const {client,error}=await getClient(); if(error)return error;
  const {table,id}=await req.json();
  if(!allowed.has(table)||!id)return NextResponse.json({error:'Invalid request'},{status:400});
  const {error:dbError}=await client.from(table).delete().eq('id',id);
  if(dbError)return NextResponse.json({error:dbError.message},{status:500});
  return NextResponse.json({ok:true});
}
