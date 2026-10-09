'use client';
import {useEffect,useRef,useState} from 'react';
import {Printer} from 'lucide-react';
import {toast} from 'sonner';
import {prepareDirectReceipt} from '@/lib/direct-receipt';
export function DirectReceiptPrint({receipt,settings}:{receipt:any,settings:any}){
 const key=JSON.stringify({receipt,settings:{name:settings.name,address:settings.address,phone:settings.phone,commercialRegister:settings.commercialRegister,taxCard:settings.taxCard,paper:settings.paper}});
 const [prepared,setPrepared]=useState<{key:string,uri?:string,error?:string}|null>(null);
 const [android,setAndroid]=useState(false),[sending,setSending]=useState(false);const last=useRef(0);
 useEffect(()=>{setAndroid(/Android/i.test(navigator.userAgent));},[]);
 useEffect(()=>{if(!android)return;let cancelled=false;const snapshot=JSON.parse(key);prepareDirectReceipt(snapshot.receipt,snapshot.settings).then(uri=>{if(!cancelled)setPrepared({key,uri});}).catch(e=>{if(!cancelled)setPrepared({key,error:e.message||'تعذر تجهيز الطباعة المباشرة'});});return()=>{cancelled=true;};},[key,android]);
 if(!android)return null;
 const ready=prepared?.key===key&&!!prepared.uri;
 return <><button type="button" className="btn primary" disabled={!ready||sending} onClick={()=>{if(!ready||Date.now()-last.current<4000)return;try{last.current=Date.now();setSending(true);window.location.assign(prepared!.uri!);toast.info('تم إرسال طلب الطباعة إلى RawBT؛ تأكد من خروج الورقة');setTimeout(()=>setSending(false),4000);}catch{setSending(false);toast.error('تعذر فتح RawBT؛ استخدم طباعة / حفظ PDF');}}}><Printer size={18}/>{sending?'تم إرسال الطلب':ready?'طباعة مباشرة':prepared?.key===key&&prepared.error?'الطباعة المباشرة غير متاحة':'تجهيز الطباعة المباشرة…'}</button>{prepared?.key===key&&prepared.error&&<span className="muted">{prepared.error}</span>}</>;
}
