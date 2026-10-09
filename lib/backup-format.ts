import {z} from 'zod';
export const MAX_BACKUP=1024*1024*1024,MAX_STATE=20*1024*1024,MAX_PART=1024*1024,MAX_IMAGE=5*1024*1024;
export const collections=['products','customers','suppliers','documents','ledger','audit'] as const;
export const manifestSchema=z.object({format:z.literal('asad-v2'),createdAt:z.string().datetime(),revision:z.number().int().nonnegative(),files:z.array(z.object({path:z.string().regex(/^(header\.json|records\/\d+\.json|images\/\d+)$/),kind:z.enum(['header','records','image']),collection:z.enum(collections).optional(),imageId:z.string().min(1).max(1000).optional(),mime:z.enum(['image/png','image/jpeg','image/webp']).optional(),size:z.number().int().positive().max(MAX_IMAGE),sha256:z.string().regex(/^[a-f0-9]{64}$/),crc32:z.number().int().min(0).max(4294967295)}).strict()).min(1).max(5000)}).strict().superRefine((m,c)=>{
 if(m.files[0]?.kind!=='header')c.addIssue({code:'custom',message:'بيانات الرأس يجب أن تكون أول جزء'});
 const fail=(message:string)=>c.addIssue({code:'custom',message});
 if(new Set(m.files.map(f=>f.path)).size!==m.files.length)fail('ملفات مكررة');
 if(m.files.filter(f=>f.kind==='header'&&f.path==='header.json').length!==1)fail('بيانات النسخة مفقودة');
 let state=0,total=0;const images=new Set();for(const f of m.files){total+=f.size;if(f.kind!=='image'){state+=f.size;if(f.size>MAX_PART)fail('جزء بيانات كبير');}if(f.kind==='records'&&(!f.collection||!f.path.startsWith('records/')))fail('جزء بيانات غير صالح');if(f.kind==='header'&&f.path!=='header.json')fail('رأس غير صالح');if(f.kind==='image'){if(!f.imageId||!f.mime||!f.path.startsWith('images/')||images.has(f.imageId))fail('صورة غير صالحة أو مكررة');images.add(f.imageId);}}
 if(state>MAX_STATE||total>MAX_BACKUP-2*MAX_PART)fail('حجم النسخة يتجاوز الحد الآمن');
});
export type Manifest=z.infer<typeof manifestSchema>;
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export async function fingerprint(bytes:Uint8Array){const digest=await crypto.subtle.digest('SHA-256',bytes as any);return {size:bytes.length,sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),crc32:crc32(bytes)};}
export const encode=(value:any)=>new TextEncoder().encode(JSON.stringify(value));
export const decode=(bytes:Uint8Array)=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
export async function verified(bytes:Uint8Array,file:Manifest['files'][number]){const hash=await fingerprint(bytes);if(hash.size!==file.size||hash.sha256!==file.sha256||hash.crc32!==file.crc32)throw new Error('جزء ناقص أو تالف من النسخة: '+file.path);}
