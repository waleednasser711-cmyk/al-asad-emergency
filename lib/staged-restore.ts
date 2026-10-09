import {db,bucket} from './database';
import {load,save} from './office-storage';
import {validateBackup} from './backup';
import {check,blank} from './business';
import {collections,manifestSchema,decode,verified,MAX_PART,MAX_IMAGE} from './backup-format';
import {runBackup} from './server-backups';
export async function startRestore(a:any,input:any){const manifest=manifestSchema.parse(input),safety=await runBackup('safety');check(safety.status!=='failed',safety.error||'تعذر حفظ نسخة الحماية');const id=crypto.randomUUID();await db().prepare('INSERT INTO restore_jobs(id,user_id,base_revision,status,manifest,header,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,a.id,safety.revision,'uploading',JSON.stringify(manifest),safety.id,new Date().toISOString()).run();return {id,baseRevision:safety.revision,safetyId:safety.id};}
async function job(a:any,id:string){const j=await db().prepare('SELECT * FROM restore_jobs WHERE id=? AND user_id=?').bind(id,a.id).first();check(j,'جلسة الاسترجاع غير موجودة');check(Date.parse(j.created_at)>Date.now()-24*3600000,'انتهت جلسة الاسترجاع؛ ابدأ من جديد');return j;}
export async function uploadPart(a:any,id:string,path:string,req:Request){const j=await job(a,id);check(j.status==='uploading','جلسة الاسترجاع مغلقة');const m=manifestSchema.parse(JSON.parse(j.manifest)),file=m.files.find(f=>f.path===path);check(file,'الجزء غير موجود في النسخة');const limit=file.kind==='image'?MAX_IMAGE:MAX_PART;check(Number(req.headers.get('content-length')||0)<=limit,'جزء كبير');const reader=req.body?.getReader();check(reader,'الجزء فارغ');let size=0;const chunks:Uint8Array[]=[];while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>limit){await reader.cancel();throw new Error('حجم الجزء كبير');}chunks.push(r.value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}await verified(bytes,file);
 const prior=await db().prepare('SELECT path FROM restore_parts WHERE job_id=? AND path=?').bind(id,path).first();if(prior)return {ok:true};
 // Parts stay invisible to business records and upload permissions until the atomic commit.
 const key='restore-staging/'+id+'/'+path;await bucket().put(key,bytes,{httpMetadata:{contentType:file.mime||'application/json'}});
 await db().prepare("INSERT INTO restore_parts(job_id,path,image_id,target_id,mime) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM restore_jobs WHERE id=? AND status='uploading') ON CONFLICT(job_id,path) DO NOTHING").bind(id,path,file.imageId||null,key,file.mime||null,id).run();return {ok:true};
}
export async function cancelRestore(a:any,id:string){await job(a,id);await db().prepare("UPDATE restore_jobs SET status='cancelled' WHERE id=? AND status='uploading'").bind(id).run();return {ok:true};}
export async function commitRestore(a:any,id:string){const j=await job(a,id);if(j.status==='committed')return {ok:true};check(j.status==='uploading','جلسة الاسترجاع مغلقة');const m=manifestSchema.parse(JSON.parse(j.manifest)),d=db();const parts=(await d.prepare('SELECT * FROM restore_parts WHERE job_id=?').bind(id).all()).results;check(parts.length===m.files.length&&m.files.every(f=>parts.some((p:any)=>p.path===f.path)),'النسخة ناقصة؛ لم تتغير البيانات الحالية');
 const snap=await load();check(snap.revision===j.base_revision,'حصلت حركات جديدة أثناء الاسترجاع؛ لم تتغير البيانات. ابدأ استرجاعًا جديدًا بعد مراجعة الشغل');
 const safety=await runBackup('safety',j.header);check(safety.status!=='failed',safety.error||'تعذر نسخة الحماية');if(safety.status!=='succeeded')return {working:true,safetyId:safety.id};check(safety.revision===j.base_revision,'نسخة الحماية لا تطابق البيانات الحالية');
 let state:any=blank();const mapping=new Map<string,string>(),uploads:any[]=[];
 for(const f of m.files){const p=parts.find((p:any)=>p.path===f.path),object=await bucket().get(p.target_id);check(object&&object.size===f.size,'جزء مفقود من التخزين المؤقت');const bytes=new Uint8Array(await object.arrayBuffer());await verified(bytes,f);
  if(f.kind==='header'){state=decode(bytes).state;check(state,'بيانات النسخة مفقودة');for(const c of collections)state[c]=[];}
  else if(f.kind==='records'){check(f.collection,'مجموعة غير صالحة');const rows=decode(bytes);check(Array.isArray(rows),'صفوف غير صالحة');state[f.collection].push(...rows);}
  else {const newId=crypto.randomUUID();await bucket().put(newId,bytes,{httpMetadata:{contentType:f.mime}});mapping.set(f.imageId!,newId);uploads.push({id:newId,mime:f.mime});}
 }
 const accounts=(await d.prepare('SELECT id,role FROM users').all()).results,restored:any=validateBackup(state,accounts),ids=new Set(accounts.map((u:any)=>u.id)),products=new Set(restored.products.map((p:any)=>p.id));
 for(const list of [restored.products,restored.customers,restored.suppliers])check(new Set(list.map((p:any)=>p.code)).size===list.length,'أكواد مكررة في النسخة');
 for(const loc of [...Object.keys(restored.cash),...Object.keys(restored.stocks)])check(['main','warehouse'].includes(loc)||ids.has(loc),'حساب مندوب غير موجود؛ استرجع النسخة في نفس البرنامج');
 for(const stock of Object.values(restored.stocks) as any[])for(const p of Object.keys(stock))check(products.has(p),'رصيد صنف غير موجود');
 for(const doc of restored.documents){if(doc.repId)check(ids.has(doc.repId),'مندوب المستند غير موجود');for(const line of doc.lines||[])check(products.has(line.productId),'صنف مستند غير موجود');if(doc.uploadId){check(mapping.has(doc.uploadId),'صورة المستند مفقودة من النسخة');doc.uploadId=mapping.get(doc.uploadId);}}
 restored.documents.sort((a:any,b:any)=>a.number-b.number);restored.ledger.sort((a:any,b:any)=>a.at.localeCompare(b.at));restored.audit.sort((a:any,b:any)=>a.at.localeCompare(b.at));
 restored.audit.push({id:crypto.randomUUID(),at:new Date().toISOString(),actorId:a.id,actor:a.name,action:'restore',detail:m.createdAt+' · نسخة حماية '+safety.id});
 await save(restored,j.base_revision,snap.state,(gate,token)=>[d.prepare(`INSERT INTO uploads(id,user_id,mime,name) SELECT json_extract(value,'$.id'),?,json_extract(value,'$.mime'),'restored' FROM json_each(?) WHERE ${gate}`).bind(a.id,JSON.stringify(uploads),token),d.prepare(`UPDATE restore_jobs SET status='committed' WHERE id=? AND ${gate}`).bind(id,token)],{sql:"EXISTS (SELECT 1 FROM restore_jobs WHERE id=? AND status='uploading')",args:[id]});return {ok:true,safetyId:safety.id};
}
