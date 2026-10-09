'use client';
import {useState} from 'react';
import {ChevronDown,CheckCircle2} from 'lucide-react';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {Command,CommandList,CommandEmpty,CommandItem} from '@/components/ui/command';

export function OfficePicker({items,value,onChange,placeholder='اختر'}:any){
 const [open,setOpen]=useState(false);
 const selected=items.find((x:any)=>x.value===value);
 return <Popover modal open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><button type="button" className="picker" role="combobox" aria-expanded={open} aria-label={placeholder}><span>{selected?.label||placeholder}</span><ChevronDown size={18}/></button></PopoverTrigger>
  <PopoverContent className="office-picker-popover" align="start" sideOffset={8} collisionPadding={16} dir="rtl">
   <Command className="office-picker-command" tabIndex={0} shouldFilter={false} aria-label="اختيار الموقع أو المندوب">
    <CommandList className="office-picker-list"><CommandEmpty>لا توجد اختيارات</CommandEmpty>
     {items.map((x:any)=><CommandItem className="office-picker-item" key={x.value} value={x.label+' '+x.value} onSelect={()=>{onChange(x.value);setOpen(false)}}>
      <span className="office-picker-text"><span className="office-picker-name">{x.name||x.label}</span>{x.code&&<span className="office-picker-code">الكود: <bdi dir="ltr">{x.code}</bdi></span>}</span>
      {x.value===value&&<CheckCircle2 className="office-picker-check" size={18} aria-label="الاختيار الحالي"/>}
     </CommandItem>)}
    </CommandList>
   </Command>
  </PopoverContent>
 </Popover>
}
