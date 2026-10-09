import {collections,decode,encode,fingerprint,manifestSchema,verified,MAX_BACKUP,MAX_STATE,MAX_PART,MAX_IMAGE} from './backup-format.ts';
import type {Manifest} from './backup-format.ts';
export type Prepared={manifest:Manifest,part:(path:string)=>Promise<Uint8Array>};
export async function prepareBackup(file:File):Promise<Prepared>{if(file.size>MAX_BACKUP)throw new Error('أقصى حجم للنسخة 1 جيجابايت');
 const first=new Uint8Array(await file.slice(0,30).arrayBuffer());const v=new DataView(first.buffer);if(first.length<30||v.getUint32(0,true)!==0x04034b50)throw new Error('ملف ZIP غير صالح');
 const firstName=new TextDecoder().decode(await file.slice(30,30+v.getUint16(26,true)).arrayBuffer());
 if(firstName==='manifest.json'){
  const positions=new Map<string,{offset:number,size:number}>(),local=new Map<string,{offset:number,size:number,crc:number}>();let offset=0,manifest:Manifest|undefined;
  for(let index=0;index<(manifest?manifest.files.length+1:1);index++){
   const bytes=await file.slice(offset,offset+30).arrayBuffer();if(bytes.byteLength!==30)throw new Error('النسخة ناقصة');const h=new DataView(bytes);if(h.getUint32(0,true)!==0x04034b50||h.getUint16(8,true)!==0||(h.getUint16(6,true)&9)!==0)throw new Error('صيغة ZIP غير مدعومة');
   const size=h.getUint32(22,true),compressed=h.getUint32(18,true),nameLength=h.getUint16(26,true),extra=h.getUint16(28,true);if(size!==compressed||nameLength>200||extra>4096)throw new Error('رأس ZIP غير صالح');
   const path=new TextDecoder().decode(await file.slice(offset+30,offset+30+nameLength).arrayBuffer()),body=offset+30+nameLength+extra;
   if(body+size>file.size||positions.has(path))throw new Error('ملف ناقص أو مكرر');
   local.set(path,{offset,size,crc:h.getUint32(14,true)});if(index===0){if(size>2*MAX_PART)throw new Error('وصف النسخة كبير');const manifestBytes=new Uint8Array(await file.slice(body,body+size).arrayBuffer());if((await fingerprint(manifestBytes)).crc32!==h.getUint32(14,true))throw new Error('وصف النسخة تالف');manifest=manifestSchema.parse(decode(manifestBytes));}
   else {const f=manifest!.files[index-1];if(f.path!==path||f.size!==size||f.crc32!==h.getUint32(14,true))throw new Error('أجزاء النسخة لا تطابق وصفها');positions.set(path,{offset:body,size});}
   offset=body+size;
  }
  const end=new DataView(await file.slice(-22).arrayBuffer());if(end.getUint32(0,true)!==0x06054b50||end.getUint16(8,true)!==manifest!.files.length+1||end.getUint32(16,true)!==offset||offset+end.getUint32(12,true)+22!==file.size)throw new Error('ملف النسخة ناقص أو يحتوي أجزاء إضافية');
  let central=offset;for(const path of ['manifest.json',...manifest!.files.map(f=>f.path)]){const raw=await file.slice(central,central+46).arrayBuffer();if(raw.byteLength!==46)throw new Error('فهرس ZIP ناقص');const h=new DataView(raw),n=h.getUint16(28,true),meta=local.get(path)!;if(h.getUint32(0,true)!==0x02014b50||h.getUint16(10,true)!==0||h.getUint32(16,true)!==meta.crc||h.getUint32(20,true)!==meta.size||h.getUint32(24,true)!==meta.size||h.getUint32(42,true)!==meta.offset||n>200||new TextDecoder().decode(await file.slice(central+46,central+46+n).arrayBuffer())!==path)throw new Error('فهرس النسخة تالف');central+=46+n+h.getUint16(30,true)+h.getUint16(32,true);}if(central!==file.size-22)throw new Error('فهرس ZIP غير صالح');
  return {manifest:manifest!,part:async(path)=>{const p=positions.get(path);if(!p)throw new Error('جزء مفقود');return new Uint8Array(await file.slice(p.offset,p.offset+p.size).arrayBuffer());}};
 }
 // Original backups remain readable, with bounded decompression to reject ZIP bombs.
 if(file.size>50*1024*1024)throw new Error('النسخة القديمة تتجاوز 50 ميجابايت؛ استخدم نسخة جديدة');
 const {unzipSync}=await import('fflate');let total=0;const files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:f=>{total+=f.originalSize;if(total>50*1024*1024||f.originalSize>(f.name==='backup.json'?MAX_STATE:MAX_IMAGE))throw new Error('حجم فك ضغط النسخة القديمة يتجاوز الحد الآمن');return true;}});
 const meta=decode(files['backup.json']);if(meta.format!=='asad-v1'||!meta.state)throw new Error('نسخة قديمة غير صالحة');
 const parts=new Map<string,Uint8Array>(),descriptors:any[]=[];const add=async(path:string,kind:string,bytes:Uint8Array,extra:any={})=>{parts.set(path,bytes);descriptors.push({path,kind,...extra,...await fingerprint(bytes)});};
 const header={...meta.state};for(const c of collections)header[c]=[];await add('header.json','header',encode({state:header,accounts:meta.accounts||[]}));
 for(const collection of collections){let rows:any[]=[];for(const row of meta.state[collection]||[]){if(encode([...rows,row]).length>MAX_PART){if(!rows.length)throw new Error('مستند كبير');await add('records/'+descriptors.length+'.json','records',encode(rows),{collection});rows=[];}rows.push(row);}if(rows.length)await add('records/'+descriptors.length+'.json','records',encode(rows),{collection});}
 for(const [imageId,image] of Object.entries(meta.images||{}) as any){const bytes=files[image.path];if(!bytes)throw new Error('صورة مفقودة من النسخة');await add('images/'+descriptors.length,'image',bytes,{imageId,mime:image.mime});}
 return {manifest:manifestSchema.parse({format:'asad-v2',createdAt:meta.createdAt||new Date().toISOString(),revision:0,files:descriptors}),part:async(path)=>parts.get(path)!};
}
async function request(url:string,body:any,retries=0):Promise<any>{for(let retry=0;;retry++){try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),j:any=await r.json();if(!r.ok){const e:any=new Error(j.backup?.error||j.error||'تعذر الاتصال');e.permanent=r.status<500;throw e;}return j;}catch(e:any){if(e.permanent||retry>=retries)throw e;await new Promise(r=>setTimeout(r,300));}}}
export async function createCloudBackup(progress:(message:string)=>void=()=>{},id?:string){let j:any;for(let i=0;i<10000;i++){j=await request('/api/backups',id?{id}:{});id=j.backup.id;if(j.backup.status==='succeeded')return j.backup;if(j.backup.status==='failed')throw new Error(j.backup.error);progress('جاري تجهيز النسخة · الجزء '+(i+1));await new Promise(r=>setTimeout(r,100));}throw new Error('النسخة لم تكتمل؛ يمكنك استكمالها من سجل النسخ');}
export async function restorePrepared(prepared:Prepared,progress:(message:string)=>void){let id:string|undefined;try{const start=await request('/api/restore',{action:'start',manifest:prepared.manifest});id=start.id;let count=0;
 for(const f of prepared.manifest.files){progress('فحص ورفع الجزء '+(++count)+' / '+prepared.manifest.files.length);const bytes=await prepared.part(f.path);await verified(bytes,f);let success=false;for(let retry=0;retry<3;retry++){try{const r=await fetch('/api/restore?id='+encodeURIComponent(id!)+'&path='+encodeURIComponent(f.path),{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:bytes as any}),j:any=await r.json();if(!r.ok)throw new Error(j.error);success=true;break;}catch(e){if(retry===2)throw e;await new Promise(r=>setTimeout(r,300));}}if(!success)throw new Error('الرفع غير مكتمل');}
 for(let i=0;i<10000;i++){progress('جاري حفظ نسخة الحماية وفحص البيانات قبل الاسترجاع');const j=await request('/api/restore',{action:'commit',id},2);if(j.ok)return j;await new Promise(r=>setTimeout(r,100));}throw new Error('لم يكتمل الاسترجاع');
 }catch(e){if(id)await request('/api/restore',{action:'cancel',id}).catch(()=>{});throw e;}}
