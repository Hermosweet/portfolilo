import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase=createClient(url,anon,{auth:{persistSession:false}});
export const adminSupabase=process.env.SUPABASE_SERVICE_ROLE_KEY?createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}}):null;
