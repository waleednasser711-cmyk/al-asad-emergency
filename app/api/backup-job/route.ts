import {runBackup,backupStatus} from '@/lib/server-backups';
import {current} from '@/lib/auth';
export const dynamic='force-dynamic';
// This narrow service endpoint relies on the confirmed owner-private Sites dispatch boundary.
// The daily task must re-check that audience before every run. Disable this route before broadening sharing.
// Service access only creates a backup and returns status; it cannot read the backup bytes or alter business records.
async function permitted(req:Request){if(req.headers.has('origin')||req.headers.has('cookie')||req.headers.has('oai-authenticated-user-id'))return (await current(req))?.role==='admin';return true;}
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){if(!await permitted(req))return json({error:'غير مسموح'},403);try{const b:any=await req.json().catch(()=>({}));const row=await runBackup(b.source==='manual'?'manual':'daily',b.id);return json({backup:row},row.status==='failed'?500:200);}catch(e:any){return json({error:'فشل تشغيل النسخ اليومي'},503);}}
export async function GET(req:Request){if(!await permitted(req))return json({error:'غير مسموح'},403);try{return json({backups:await backupStatus()});}catch{return json({error:'تعذر قراءة حالة النسخ'},503);}}
