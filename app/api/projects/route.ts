import {NextResponse} from 'next/server';

const topic = (process.env.GITHUB_PROJECT_TOPIC || 'hermela-portfolio').trim().toLowerCase();

export const runtime = 'nodejs';

export async function GET(){
  const username = process.env.GITHUB_USERNAME;
  if(!username) return NextResponse.json({data:[], topic});

  const headers:Record<string,string> = {
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    'User-Agent':'Hermela-Portfolio'
  };
  if(process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try{
    const r = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,{
      headers,
      cache:'no-store'
    });
    if(!r.ok) return NextResponse.json({data:[],topic,error:`GitHub request failed (${r.status})`},{status:502});

    const repos = await r.json();
    const data = repos
      .filter((x:any)=>!x.fork && !x.archived && !x.private)
      .filter((x:any)=>Array.isArray(x.topics) && x.topics.some((t:string)=>t.toLowerCase()===topic))
      .map((x:any)=>({
        id:`github-${x.id}`,
        title:x.name,
        description:x.description||null,
        github_url:x.html_url,
        live_url:x.homepage||null,
        image_url:null,
        github_owner:x.owner?.login||username,
        github_repo:x.name,
        topics:Array.isArray(x.topics)?x.topics:[],
        stars:x.stargazers_count||0,
        forks:x.forks_count||0,
        featured:false,
        is_public:true,
        display_order:0
      }));

    return NextResponse.json({data,topic},{headers:{'Cache-Control':'no-store'}});
  }catch{
    return NextResponse.json({data:[],topic,error:'Unable to reach GitHub'},{status:502});
  }
}
