'use client';
import {useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Checkbox} from '@/components/ui/checkbox';
import {assignedToRep} from '@/lib/rep-assignments';
import {AssignmentImport} from '@/components/assignment-import';

export function RepAssignments({rep,customers,products,onSave,busy}:any){
 const [open,setOpen]=useState(false),[customerIds,setCustomerIds]=useState<string[]>([]),[productIds,setProductIds]=useState<string[]>([]);
 const [customerSearch,setCustomerSearch]=useState(''),[productSearch,setProductSearch]=useState(''),[saving,setSaving]=useState(false);
 const [expected,setExpected]=useState<{customerIds:string[],productIds:string[]}>({customerIds:[],productIds:[]});
 function reset(){const current={customerIds:customers.filter((c:any)=>assignedToRep(c,rep.id)).map((c:any)=>c.id),productIds:products.filter((p:any)=>assignedToRep(p,rep.id)).map((p:any)=>p.id)};setExpected(current);setCustomerIds(current.customerIds);setProductIds(current.productIds);setCustomerSearch('');setProductSearch('');}
 function toggle(id:string,checked:boolean,set:any){set((ids:string[])=>checked?[...ids.filter(x=>x!==id),id]:ids.filter(x=>x!==id));}
 function list(title:string,rows:any[],ids:string[],set:any,search:string,setSearch:any){
  const filtered=rows.filter(row=>`${row.name} ${row.code}`.toLowerCase().includes(search.toLowerCase()));
  const selected=new Set(ids);
  return <section className="assignment-section"><h3>{title} · {ids.length} / {rows.length}</h3>
   <input aria-label={'بحث في '+title} placeholder="بحث بالاسم أو الكود" value={search} onChange={e=>setSearch(e.target.value)}/>
   <div className="toolbar"><button type="button" className="btn" onClick={()=>set((current:string[])=>[...new Set([...current,...filtered.map(row=>row.id)])])}>تحديد النتائج</button><button type="button" className="btn" onClick={()=>{const shown=new Set(filtered.map(row=>row.id));set((current:string[])=>current.filter(id=>!shown.has(id)))}}>إلغاء تحديد النتائج</button></div>
   <div className="assignment-list" tabIndex={0} aria-label={title}>{filtered.length?filtered.map(row=><label key={row.id} className="assignment-row"><Checkbox checked={selected.has(row.id)} onCheckedChange={checked=>toggle(row.id,checked===true,set)} aria-label={row.name}/><span><strong>{row.name}</strong><small><bdi dir="ltr">{row.code}</bdi>{row.archived?' · مؤرشف':''}</small></span></label>):<p className="muted">لا توجد نتائج</p>}</div>
  </section>;
 }
 return <><button className="link" type="button" onClick={()=>{reset();setOpen(true)}}>تخصيص العملاء والأصناف</button>
  <Dialog open={open} onOpenChange={value=>{if(!saving)setOpen(value)}}><DialogContent className="office-dialog wide assignment-dialog" dir="rtl"><DialogHeader><DialogTitle>تخصيص العملاء والأصناف · {rep.name}</DialogTitle><DialogDescription>حدّد ما يسمح لهذا المندوب التعامل معه. يمكن تخصيص العميل والصنف لأكثر من مندوب.</DialogDescription></DialogHeader>
   <p className="notice">إلغاء تحديد العميل يخفيه وفواتيره السابقة عن المندوب ويمنع التعامل عليه. تظل البيانات محفوظة في الحساب الرئيسي. الأصناف غير المحددة لا تُباع أو تُطلب للتحميل؛ رصيد العهدة يظل متاحًا للجرد والرد للمخزن.</p>
   <AssignmentImport reps={[rep]} customers={customers} products={products} onSave={async(body:any)=>{const result=await onSave(body);if(result)setOpen(false);return result}} busy={busy}/>
   <div className="assignment-grid">{list('العملاء',customers,customerIds,setCustomerIds,customerSearch,setCustomerSearch)}{list('الأصناف',products,productIds,setProductIds,productSearch,setProductSearch)}</div>
   <div className="toolbar"><button className="btn" type="button" disabled={saving||busy} onClick={reset}>إعادة تحميل القوائم</button><button className="btn" type="button" disabled={saving} onClick={()=>setOpen(false)}>إلغاء</button><button className="btn primary" type="button" disabled={saving||busy} onClick={async()=>{setSaving(true);try{const result=await onSave({action:'assignRep',repId:rep.id,customerIds,productIds,expected});if(result)setOpen(false)}finally{setSaving(false)}}}>{saving?'جاري الحفظ…':'حفظ التخصيص'}</button></div>
  </DialogContent></Dialog>
 </>;
}
