import { NextResponse } from 'next/server';
import { adminSupabase } from '../../../../lib/supabase';
import { isAdmin } from '../../../../lib/auth';

export const runtime='nodejs';

export async function POST(req:Request){
  if(!isAdmin()) return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!adminSupabase) return NextResponse.json({error:'Server database key is missing'},{status:500});
  const form=await req.formData();
  const file=form.get('file');
  if(!(file instanceof File)) return NextResponse.json({error:'No image selected'},{status:400});
  if(!file.type.startsWith('image/')) return NextResponse.json({error:'Only image files are allowed'},{status:400});
  if(file.size>5*1024*1024) return NextResponse.json({error:'Image must be 5MB or smaller'},{status:400});

  const bucket='portfolio-media';
  const buckets=await adminSupabase.storage.listBuckets();
  if(!buckets.data?.some(b=>b.name===bucket)){
    const created=await adminSupabase.storage.createBucket(bucket,{public:true,fileSizeLimit:'5MB',allowedMimeTypes:['image/*']});
    if(created.error) return NextResponse.json({error:created.error.message},{status:500});
  }
  const ext=file.name.split('.').pop()?.toLowerCase()||'png';
  const path=`portfolio/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const {error}=await adminSupabase.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  const {data}=adminSupabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({url:data.publicUrl});
}
