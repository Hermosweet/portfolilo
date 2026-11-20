import {NextResponse} from 'next/server';
import {isAdmin} from '../../../../lib/auth';

const topic = (process.env.GITHUB_PROJECT_TOPIC || 'hermela-portfolio').trim().toLowerCase();

export const runtime = 'nodejs';

export async function POST(){
  if(!isAdmin()) return NextResponse.json({error:'Unauthorized'},{status:401});
  const username = process.env.GITHUB_USERNAME;
  if(!username) return NextResponse.json({error:'GitHub username is not configured'},{status:500});

  const headers:Record<string,string> = {
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    'User-Agent':'Hermela-Portfolio'
  };
  if(process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try{
    const r = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,{headers,cache:'no-store'});
    if(!r.ok){
      const body = await r.text().catch(()=> '');
      return NextResponse.json({error:`GitHub sync failed (${r.status})${body?`: ${body.slice(0,180)}`:''}`},{status:502});
    }
    const repos = await r.json();
    const matching = repos.filter((x:any)=>!x.fork && !x.archived && !x.private && Array.isArray(x.topics) && x.topics.some((t:string)=>t.toLowerCase()===topic));
    return NextResponse.json({ok:true,count:matching.length,topic,message:`Found ${matching.length} public project${matching.length===1?'':'s'} with topic “${topic}”.`});
  }catch(error:any){
    return NextResponse.json({error:error?.message||'Unable to reach GitHub'},{status:502});
  }
}
