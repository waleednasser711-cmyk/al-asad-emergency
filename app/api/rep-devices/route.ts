import {current} from '@/lib/auth';
import {db} from '@/lib/database';
import {load,save} from '@/lib/office-storage';
import {check} from '@/lib/business';
export const dynamic='force-dynamic';
const out=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){const a=await current(req);if(a?.role!=='admin')return out({error:'إدارة الأجهزة للحساب الرئيسي فقط'},403);try{
 const devices=(await db().prepare("SELECT rd.id,rd.user_id AS userId,u.name AS repName,u.username,rd.name,rd.status,rd.requested_at AS requestedAt,rd.reviewed_at AS reviewedAt,rd.reason FROM rep_devices rd JOIN users u ON u.id=rd.user_id WHERE u.role='rep' ORDER BY rd.requested_at DESC").all()).results;
 return out({devices});
}catch{return out({error:'تعذر تحميل الأجهزة'},503)}}
export async function POST(req:Request){try{
 check(req.headers.get('origin')===new URL(req.url).origin,'مصدر الطلب غير مسموح');
 const a=await current(req);if(a?.role!=='admin')return out({error:'إدارة الأجهزة للحساب الرئيسي فقط'},403);
 const b:any=await req.json();check(['approve','reject','revoke'].includes(b.action),'إجراء غير صالح');check(typeof b.reason==='string'&&b.reason.trim().length>=3&&b.reason.length<=300,'اكتب سبب القرار (3 خانات على الأقل)');
 const d=db(),device=await d.prepare("SELECT rd.* FROM rep_devices rd JOIN users u ON u.id=rd.user_id WHERE rd.id=? AND u.role='rep' AND u.active=1").bind(b.id).first();check(device,'الجهاز أو المندوب غير متاح');
 check(b.status===device.status,'تغيرت حالة الجهاز؛ حدّث القائمة');check(b.action==='approve'?device.status!=='approved':b.action==='revoke'?device.status==='approved':device.status==='pending','الجهاز ليس في الحالة المطلوبة');
 const {state,revision}=await load(),old=structuredClone(state),at=new Date().toISOString(),status=b.action==='approve'?'approved':b.action==='reject'?'rejected':'revoked';
 state.audit.push({id:crypto.randomUUID(),at,actorId:a.id,actor:a.name,action:'repDevice',detail:(b.action==='approve'?'اعتماد جهاز':b.action==='reject'?'رفض جهاز':'إيقاف جهاز')+' · '+device.user_id+' · '+device.id.slice(0,8)+' · '+b.reason.trim()});
 await save(state,revision,old,(gate,token)=>[
  ...(b.action==='approve'?[d.prepare(`UPDATE rep_devices SET status='revoked',reviewed_at=?,reviewed_by=?,reason=? WHERE user_id=? AND status='approved' AND ${gate}`).bind(at,a.id,'استبدال الجهاز المعتمد: '+b.reason.trim(),device.user_id,token)]:[]),
  d.prepare(`UPDATE rep_devices SET status=?,reviewed_at=?,reviewed_by=?,reason=? WHERE id=? AND ${gate}`).bind(status,at,a.id,b.reason.trim(),device.id,token),
  ...(b.action!=='reject'?[d.prepare(`DELETE FROM sessions WHERE user_id=? AND ${gate}`).bind(device.user_id,token)]:[])
 ],{sql:'EXISTS(SELECT 1 FROM rep_devices WHERE id=? AND status=?)',args:[device.id,device.status]});
 return out({ok:true});
}catch(e:any){return out({error:e.message||'تعذر حفظ قرار الجهاز'},400)}}
