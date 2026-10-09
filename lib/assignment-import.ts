import {assignedToRep} from './rep-assignments.ts';
export type AssignmentRow={kind:'customers'|'products',repUsername:string,code:string,row:number};
export function assignmentWorkbook(XLSX:typeof import('xlsx'),reps:any[],customers:any[],products:any[]){
 const wb=XLSX.utils.book_new();
 const sheets:[string,any[][]][]=[
  ['العملاء',[['repUsername','customerCode']]],['الأصناف',[['repUsername','productCode']]],
  ['تعليمات',[
   ['الحقل','طريقة التعبئة'],['repUsername','اسم مستخدم المندوب من ورقة دليل المناديب'],['customerCode','كود العميل من ورقة دليل العملاء'],['productCode','كود الصنف من ورقة دليل الأصناف'],
   ['مثال العملاء','rep01 | C001'],['مثال الأصناف','rep01 | P001'],['المشاركة','كرر الكود في صف آخر باسم مستخدم مندوب آخر'],['الأكواد','احفظ الأكواد كنص للحفاظ على الأصفار في بدايتها'],
   ['الإضافة','تحتفظ بالتخصيص الحالي وتضيف ما في الشيت'],['الاستبدال','يستبدل تخصيص النوع الموجود في الشيت للمناديب المذكورين فقط. الورقة الفارغة لا تلغي أي تخصيص'],['الحفظ','راجع المعاينة قبل الحفظ. الأخطاء والتكرار يمنعان الحفظ']]],
  ['دليل المناديب',[['اسم المستخدم','اسم المندوب'],...reps.map(r=>[r.username,r.name])]],
  ['دليل العملاء',[['كود العميل','اسم العميل'],...customers.map(c=>[String(c.code),c.name])]],
  ['دليل الأصناف',[['كود الصنف','اسم الصنف'],...products.map(p=>[String(p.code),p.name])]],
 ];
 for(const [name,rows] of sheets){const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=name==='تعليمات'?[{wch:22},{wch:95}]:[{wch:28},{wch:48}];for(const addr of Object.keys(ws))if(!addr.startsWith('!'))ws[addr].z='@';XLSX.utils.book_append_sheet(wb,ws,name)}
 wb.Workbook={Views:[{RTL:true}]};wb.Props={Title:'نموذج تخصيص العملاء والأصناف',Company:'شركة الأسد'};return wb;
}
export function readAssignmentWorkbook(XLSX:typeof import('xlsx'),wb:import('xlsx').WorkBook):AssignmentRow[]{
 const result:AssignmentRow[]=[];let found=false;
 for(const [sheet,kind,codeKey] of [['العملاء','customers','customerCode'],['الأصناف','products','productCode']] as const){
  const ws=wb.Sheets[sheet];if(!ws)continue;found=true;
  if(ws['!ref']){const range=XLSX.utils.decode_range(ws['!ref']);if(range.e.r>3100||range.e.c>30)throw new Error(`ورقة ${sheet}: عدد الصفوف أو الأعمدة أكبر من المسموح`);}
  const rows:any[][]=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false,blankrows:true});
  const heads=(rows[0]||[]).map(v=>String(v).trim());const repCol=heads.indexOf('repUsername'),codeCol=heads.indexOf(codeKey);
  if(repCol<0||codeCol<0||heads.filter(h=>h==='repUsername').length!==1||heads.filter(h=>h===codeKey).length!==1)throw new Error(`ورقة ${sheet}: الأعمدة المطلوبة repUsername و ${codeKey}`);
  for(let i=1;i<rows.length;i++){const row=rows[i];if(row.every(v=>String(v).trim()===''))continue;
   const repUsername=String(row[repCol]??'').trim(),code=String(row[codeCol]??'').trim();
   if(!repUsername||!code)throw new Error(`ورقة ${sheet}، صف ${i+1}: اسم مستخدم المندوب والكود مطلوبان`);
   for(const col of [repCol,codeCol])if(ws[XLSX.utils.encode_cell({r:i,c:col})]?.f)throw new Error(`ورقة ${sheet}، صف ${i+1}: استخدم قيمة ثابتة بدل المعادلة`);
   result.push({kind,repUsername,code,row:i+1});if(result.length>3000)throw new Error('أقصى عدد 3000 صف في الشيت');
  }
 }
 if(!found)throw new Error('استخدم النموذج: ورقة العملاء أو الأصناف غير موجودة');
 if(!result.length)throw new Error('الشيت لا يحتوي تخصيصات');return result;
}
export function previewAssignments(rows:AssignmentRow[],reps:any[],state:{customers:any[],products:any[]},mode:'add'|'replace'){
 if(!['add','replace'].includes(mode))throw new Error('اختر طريقة الاستيراد');
 const groups=new Map<string,{rep:any,customers?:Set<string>,products?:Set<string>}>(),seen=new Set<string>(),errors:string[]=[];
 for(const row of rows){const title=row.kind==='customers'?'العملاء':'الأصناف',prefix=`${title}، صف ${row.row}: `;
  const rep=reps.find(r=>r.role==='rep'&&r.username.toLowerCase()===row.repUsername.toLowerCase());const entity=state[row.kind].find(x=>String(x.code)===row.code);
  if(!rep){errors.push(prefix+'اسم مستخدم المندوب غير موجود');continue}if(!entity){errors.push(prefix+'الكود غير موجود: '+row.code);continue}
  const key=JSON.stringify([rep.id,row.kind,entity.id]);if(seen.has(key)){errors.push(prefix+'تخصيص مكرر');continue}seen.add(key);
  const group=groups.get(rep.id)||{rep};group[row.kind]??=new Set<string>();group[row.kind]!.add(entity.id);groups.set(rep.id,group);
 }
 const plans:any[]=[],summary:any[]=[];
 for(const {rep,...kinds} of groups.values()){
  const expected={customerIds:state.customers.filter(c=>assignedToRep(c,rep.id)).map(c=>c.id),productIds:state.products.filter(p=>assignedToRep(p,rep.id)).map(p=>p.id)};
  const plan:any={repId:rep.id,expected};const stats:any={name:rep.name,username:rep.username};
  for(const [kind,key] of [['customers','customerIds'],['products','productIds']] as const){const before=expected[key],imported=kinds[kind];plan[key]=!imported?before:mode==='add'?[...new Set([...before,...imported])]:[...imported];const after=new Set<string>(plan[key]),old=new Set(before);stats[kind]={added:plan[key].filter((id:string)=>!old.has(id)).length,removed:before.filter(id=>!after.has(id)).length,total:after.size,touched:!!imported};}
  plans.push(plan);summary.push(stats);
 }
 if(plans.length>100)errors.push('أقصى عدد 100 مندوب في عملية الاستيراد الواحدة');
 return {plans,summary,errors,rowCount:rows.length};
}
