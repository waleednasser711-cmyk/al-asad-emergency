'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';

// Scale the screen container only; printed/exported article markup keeps its size.
export function ReceiptPreview({compact,children}:{compact:boolean,children:ReactNode}){
 const viewport=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null);
 const [fit,setFit]=useState({scale:1,height:0});
 useEffect(()=>{
  if(!compact)return;
  const box=viewport.current,body=content.current;if(!box||!body)return;
  let cancelled=false;
  const measure=()=>{if(cancelled)return;const height=body.scrollHeight,width=body.offsetWidth;if(!height||!width)return;const scale=Math.min(1,Math.max(.45,Math.min(box.clientWidth/width,box.clientHeight/height)));setFit(old=>old.scale===scale&&old.height===height?old:{scale,height});};
  const observer=new ResizeObserver(measure);observer.observe(box);observer.observe(body);measure();document.fonts.ready.then(measure);
  return()=>{cancelled=true;observer.disconnect();};
 },[compact]);
 if(!compact)return <>{children}</>;
 return <div className="receipt-preview" ref={viewport}><div className="receipt-preview-space" style={{height:fit.height*fit.scale}}><div className="receipt-preview-content" ref={content} style={{transform:`scale(${fit.scale})`}}>{children}</div></div></div>;
}
