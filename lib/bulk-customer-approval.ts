export type ApprovalResult={id:string,status:'approved'|'failed'|'skipped'|'unknown'|'notAttempted',message:string};
// Every item uses the existing individual endpoint, revision gate, validation and audit.
export async function approveCustomerRequests(ids:string[],progress:(done:number,total:number)=>void=()=>{},fetcher:typeof fetch=fetch):Promise<ApprovalResult[]>{
 if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=='string'||!id))throw new Error('حدد طلبات العملاء أولًا');
 const unique=[...new Set(ids)],results:ApprovalResult[]=[];
 const http=async(body?:any)=>{for(let attempt=0;attempt<2;attempt++){try{const r=await fetcher('/api/office',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)}:{cache:'no-store',signal:AbortSignal.timeout(15000)});const j:any=await r.json();if(r.status>=500)throw new Error('تعذر الاتصال');return {r,j};}catch(e){if(attempt===1)throw e;}}throw new Error('تعذر الاتصال');};
 for(const id of unique){let sent=false;try{
  const token=crypto.randomUUID();let result:ApprovalResult|undefined;
  for(let attempt=0;attempt<2;attempt++){
   const {r,j}=await http();if(!r.ok||j.user?.role!=='admin'){results.push({id,status:sent?'unknown':'failed',message:'سجل الدخول بالحساب الرئيسي؛ توقفت العملية'});for(const rest of unique.slice(results.length))results.push({id:rest,status:'notAttempted',message:'لم تتم المحاولة بعد توقف العملية'});return results;}
   const doc=j.state.documents.find((d:any)=>d.id===id);if(!doc||doc.type!=='customerRequest'||doc.status!=='pending'){result={id,status:'skipped',message:doc?.type==='customerRequest'?'تمت مراجعة الطلب بالفعل؛ لم يُعتمد مرة أخرى':'ليس طلب إضافة عميل متاحًا'};break;}
   sent=true;const response=await http({action:'approve',id,revision:j.revision,requestId:token});
   if(response.r.ok){if(response.j.document?.id!==id||response.j.document?.type!=='customerRequest'||response.j.document?.status!=='approved')throw new Error('نتيجة غير مؤكدة');result={id,status:'approved',message:'تم اعتماد العميل'};break;}
   if(attempt===0&&response.r.status===400&&String(response.j.error).includes('تغيرت البيانات'))continue;
   result={id,status:'failed',message:response.j.error||'تعذر الاعتماد'};break;
  }
  results.push(result||{id,status:'failed',message:'تغيرت البيانات؛ حدّث وحاول مرة أخرى'});
 }catch{results.push({id,status:sent?'unknown':'failed',message:sent?'تعذر تأكيد نتيجة الطلب؛ حدّث السجل قبل إعادة المحاولة':'تعذر الاتصال؛ لم تتم المحاولة'});for(const rest of unique.slice(results.length))results.push({id:rest,status:'notAttempted',message:'لم تتم المحاولة بعد انقطاع الاتصال'});return results;}
 progress(results.length,unique.length);
 }
 return results;
}
