import {NextResponse} from 'next/server';
import {supabase} from '../../../lib/supabase';

export async function GET(){
  const {data}=await supabase.from('profile').select('avatar_url,name').limit(1).maybeSingle();
  if(data?.avatar_url){
    try{
      const r=await fetch(data.avatar_url,{cache:'no-store'});
      if(r.ok){
        const b=await r.arrayBuffer();
        return new NextResponse(b,{headers:{'Content-Type':r.headers.get('content-type')||'image/png','Cache-Control':'public,max-age=300'}});
      }
    }catch{}
  }
  const letter=(data?.name||'H').trim().charAt(0).toUpperCase()||'H';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g"><stop stop-color="#d7ff68"/><stop offset="1" stop-color="#17633f"/></radialGradient></defs><rect width="64" height="64" rx="18" fill="#061b13"/><circle cx="32" cy="32" r="24" fill="url(#g)"/><text x="32" y="41" text-anchor="middle" font-family="Arial" font-size="28" font-weight="900" fill="#fff">${letter}</text></svg>`;
  return new NextResponse(svg,{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public,max-age=300'}});
}
