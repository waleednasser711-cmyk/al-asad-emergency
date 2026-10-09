import {current,digest} from '@/lib/auth';
import {db} from '@/lib/database';
import {load,save} from '@/lib/office-storage';
import {check,visible} from '@/lib/business';
import {offlineSaleSchema,postOfflineSale} from '@/lib/offline-sales';
export const dynamic='force-dynamic';
const out=(v:any,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){try{
 check(req.headers.get('origin')===new URL(req.url).origin,'مصدر الطلب غير مسموح');check(Number(req.headers.get('content-length')||0)<250000,'الطلب كبير');
 const actor=await current(req);if(!actor)return out({error:'سجل الدخول لاستكمال المزامنة'},401);
 const b:any=await req.json(),review=b.action==='review';check(review?actor.role==='admin':actor.role==='rep','غير مسموح لهذا الحساب');
 if(review)check(typeof b.reason==='string'&&b.reason.trim().length>0&&b.reason.length<=500,'اكتب سبب اعتماد الفاتورة بعد مراجعة التعارض');
 for(let attempt=0;attempt<5;attempt++){
 const {state,revision}=await load(),old=structuredClone(state);
 const existing=state.documents.find((d:any)=>d.offlineId===(review?b.id:b.payload?.id)&&d.actorId===(review?b.actorId:actor.id));
 check(!review||existing,'فاتورة المراجعة غير موجودة');
 const payload=offlineSaleSchema.parse(review?existing!.clientPayload:b.payload);check(payload.actorId===(review?b.actorId:actor.id),'الفاتورة تخص حسابًا آخر');
 const fingerprint=await digest(JSON.stringify(payload));if(existing)check(existing.offlineFingerprint===fingerprint,'معرف الفاتورة مستخدم ببيانات مختلفة');
 if(existing?.type==='sale')return out({ok:true,document:actor.role==='rep'?visible(state,actor).documents.find((d:any)=>d.id===existing.id):existing});
 if(existing?.type==='offlineSale'&&!review)return out({ok:false,review:true,error:existing.syncError,requestId:existing.id});
 const users=(await db().prepare('SELECT id,name,role,active,price_tier AS priceTier FROM users').all()).results;
 const rep=users.find((u:any)=>u.id===payload.actorId),repIds=users.filter((u:any)=>u.role==='rep'&&u.active).map((u:any)=>u.id);
 let document:any,error='';const candidate=structuredClone(state);
 try{document=postOfflineSale(candidate,rep,payload,repIds,review?actor:undefined,review?b.reason.trim():'');document.offlineFingerprint=fingerprint;document.clientPayload=payload;if(existing){candidate.documents=candidate.documents.filter((d:any)=>d.id!==existing.id);document.reviewRequestId=existing.id;} }
 catch(e:any){error=e.message;}
 if(error){
  if(review)return out({error},409);
  if(existing)return out({ok:false,review:true,error,requestId:existing.id});
  const pending={id:crypto.randomUUID(),number:state.documents.reduce((n:number,d:any)=>Math.max(n,d.number),0)+1,type:'offlineSale',at:new Date().toISOString(),actorId:actor.id,actorName:actor.name,repId:actor.id,status:'pending',offlineId:payload.id,offlineFingerprint:fingerprint,clientPayload:payload,syncError:error};
  state.documents.push(pending);state.audit.push({id:crypto.randomUUID(),at:pending.at,actorId:actor.id,actor:actor.name,action:'offlineSale',documentId:pending.id,detail:error});
  try{await save(state,revision,old);return out({ok:false,review:true,error,requestId:pending.id});}catch(e){if(attempt===4)throw e;continue;}
 }
 const audit=candidate.audit[candidate.audit.length-1];audit.requestId=payload.id;if(review){audit.detail+=' · معالجة تعارض: '+b.reason.trim();}
 try{await save(candidate,revision,old);return out({ok:true,document:actor.role==='rep'?visible(candidate,actor).documents.find((d:any)=>d.id===document.id):document});}catch(e){if(attempt===4)throw e;}
 }
 return out({error:'تعذر المزامنة؛ أعد المحاولة'},503);
}catch(e:any){return out({error:e.message||'تعذر المزامنة'},400)}}
