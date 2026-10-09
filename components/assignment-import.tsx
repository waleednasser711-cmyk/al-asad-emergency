'use client';
import {useMemo,useState} from 'react';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Checkbox} from '@/components/ui/checkbox';
import {assignmentWorkbook,readAssignmentWorkbook,previewAssignments,AssignmentRow} from '@/lib/assignment-import';

export function AssignmentImport({reps,customers,products,onSave,busy}:any){
 const [open,setOpen]=useState(false),[mode,setMode]=useState<'add'|'replace'>('add'),[source,setSource]=useState<{rows:AssignmentRow[],state:any,reps:any[]}|null>(null),[working,setWorking]=useState(false),[confirmed,setConfirmed]=useState(false),[filename,setFilename]=useState('');
 const preview=useMemo(()=>source?previewAssignments(source.rows,source.reps,source.state,mode):null,[source,mode]);
 async function template(){setWorking(true);try{const XLSX=await import('xlsx');XLSX.writeFile(assignmentWorkbook(XLSX,reps,customers,products),'نموذج-تخصيص-المناديب.xlsx')}catch{toast.error('تعذر تنزيل النموذج')}finally{setWorking(false)}}
 async function read(file:File){setSource(null);setConfirmed(false);setFilename('');setWorking(true);try{
  if(file.size>10*1024*1024)throw new Error('أقصى حجم للشيت 10 ميجا');if(!/\.xlsx$/i.test(file.name))throw new Error('ارفع ملف Excel بصيغة .xlsx');
  const XLSX=await import('xlsx');const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellFormula:true});const rows=readAssignmentWorkbook(XLSX,wb);
  setSource({rows,state:structuredClone({customers,products}),reps:structuredClone(reps)});setFilename(file.name);
 }catch(e:any){toast.error(e.message||'تعذر قراءة الشيت')}finally{setWorking(false)}}
 const removing=preview?.summary.some(x=>x.customers.removed||x.products.removed);
 return <><button type="button" className="btn" onClick={()=>{setOpen(true);setSource(null);setConfirmed(false);setMode('add');setFilename('')}}>تخصيص من شيت أكسيل</button>
  <Dialog open={open} onOpenChange={value=>{if(!working)setOpen(value)}}><DialogContent className="office-dialog wide assignment-import-dialog" dir="rtl"><DialogHeader><DialogTitle>تخصيص العملاء والأصناف من أكسيل</DialogTitle><DialogDescription>نزّل النموذج، املأ ورقتي العملاء والأصناف، ثم ارفع الملف وراجع المعاينة.</DialogDescription></DialogHeader>
   <div className="toolbar"><button type="button" className="btn" disabled={working} onClick={template}>تنزيل شيت نموذج</button><label className="btn">رفع شيت أكسيل<input aria-label="رفع شيت التخصيص" type="file" accept=".xlsx" disabled={working} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void read(file)}}/></label></div>
   <p className="muted">الأعمدة: repUsername مع customerCode للعملاء، وrepUsername مع productCode للأصناف. النموذج يحتوي دليلًا بأسماء مستخدمي المناديب والأكواد الحالية.</p>
   <fieldset className="assignment-import-mode" disabled={working}><legend>طريقة الاستيراد</legend><label><input type="radio" checked={mode==='add'} onChange={()=>{setMode('add');setConfirmed(false)}}/> إضافة للتخصيص الحالي</label><label><input type="radio" checked={mode==='replace'} onChange={()=>{setMode('replace');setConfirmed(false)}}/> استبدال التخصيص الحالي</label></fieldset>
   {mode==='replace'&&<p className="notice">الاستبدال يخص المناديب المذكورين والنوع الموجود في الشيت فقط. الورقة الفارغة لا تلغي تخصيصات ذلك النوع. إلغاء العميل يخفي فواتيره عن المندوب، وتظل محفوظة في الحساب الرئيسي.</p>}
   {preview&&<><p><bdi>{filename}</bdi> · {preview.rowCount} صف · {preview.summary.length} مندوب</p>
    {preview.errors.length>0?<div className="assignment-import-errors" role="alert"><strong>صحّح الأخطاء ثم أعد رفع الملف؛ لن تُحفظ أي تخصيصات:</strong>{preview.errors.slice(0,100).map((error,i)=><p key={i}>{error}</p>)}{preview.errors.length>100&&<p>وأخطاء أخرى؛ إجمالي الأخطاء {preview.errors.length}</p>}</div>:<div className="assignment-list"><table className="assignment-preview"><thead><tr><th>المندوب</th><th>العملاء: إضافة / إلغاء / الإجمالي</th><th>الأصناف: إضافة / إلغاء / الإجمالي</th></tr></thead><tbody>{preview.summary.map(x=><tr key={x.username}><td>{x.name}<br/><bdi>{x.username}</bdi></td>{['customers','products'].map(kind=><td key={kind}>{x[kind].touched?`${x[kind].added} / ${x[kind].removed} / ${x[kind].total}`:'بدون تغيير'}</td>)}</tr>)}</tbody></table></div>}
    {removing&&!preview.errors.length&&<label className="assignment-row"><Checkbox checked={confirmed} onCheckedChange={value=>setConfirmed(value===true)}/><span>أوافق على إلغاء التخصيصات الموضحة في المعاينة</span></label>}
   </>}
   <div className="toolbar"><button type="button" className="btn" disabled={working} onClick={()=>setOpen(false)}>إلغاء</button><button type="button" className="btn primary" disabled={working||busy||!preview||!!preview.errors.length||!!removing&&!confirmed} onClick={async()=>{if(!preview)return;setWorking(true);try{const result=await onSave({action:'importAssignments',plans:preview.plans,mode});if(result){setOpen(false);setSource(null)}}finally{setWorking(false)}}}>{working?'جاري التجهيز…':'حفظ التخصيصات'}</button></div>
  </DialogContent></Dialog>
 </>;
}
