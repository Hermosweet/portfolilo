import {createHmac,timingSafeEqual} from 'crypto';
import {cookies} from 'next/headers';
const cookieName='hermela_admin_session';
function secret(){return process.env.ADMIN_SESSION_SECRET||'dev-change-me';}
function sign(v:string){return createHmac('sha256',secret()).update(v).digest('hex');}
export function makeSession(){const value=`${process.env.ADMIN_USERNAME||''}:${Date.now()}`;return `${value}.${sign(value)}`;}
export function verifySession(token?:string){if(!token)return false;const i=token.lastIndexOf('.');if(i<1)return false;const value=token.slice(0,i),sig=token.slice(i+1),expected=sign(value);try{return timingSafeEqual(Buffer.from(sig),Buffer.from(expected))}catch{return false}}
export function setSession(){cookies().set(cookieName,makeSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});}
export function clearSession(){cookies().set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});}
export function isAdmin(){return verifySession(cookies().get(cookieName)?.value);}
export const SESSION_COOKIE=cookieName;