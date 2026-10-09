import {current} from '@/lib/auth';
import {load} from '@/lib/office-storage';
import {accountStatement} from '@/lib/statements';
import {customerAllowed} from '@/lib/rep-assignments';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const a=await current(req);if(!a)return Response.json({error:'سجل الدخول أولًا'},{status:401});if(a.role==='warehouse')return Response.json({error:'غير مسموح'},{status:403});const p=new URL(req.url).searchParams,entity=p.get('entity')||'customer';if(a.role!=='admin'&&entity!=='customer')return Response.json({error:'غير مسموح'},{status:403});const {state,revision}=await load();if(a.role!=='admin'&&!customerAllowed(state,a.id,p.get('id')||''))return Response.json({error:'العميل غير مخصص لهذا المندوب'},{status:403});return Response.json({statement:accountStatement(state,p.get('id')||'',entity,p.get('from')||'',p.get('to')||''),revision},{headers:{'Cache-Control':'private, no-store'}});}catch(e:any){return Response.json({error:e.message},{status:400});}}
