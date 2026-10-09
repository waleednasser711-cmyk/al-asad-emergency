'use client';
import type {ReactNode} from 'react';
import {SidebarMenuButton,useSidebar} from '@/components/ui/sidebar';
export function OfficeNavigationButton({active,onSelect,children}:{active:boolean,onSelect:()=>void,children:ReactNode}){
 const {isMobile,setOpenMobile}=useSidebar();
 return <SidebarMenuButton isActive={active} onClick={()=>{onSelect();if(isMobile)setOpenMobile(false);}}>{children}</SidebarMenuButton>;
}
