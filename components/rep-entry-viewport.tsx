'use client';
import {useEffect} from 'react';
import {bindRepDialogViewport} from '@/lib/rep-dialog-viewport';
export function RepEntryViewport(){
 useEffect(()=>{const dialog=document.querySelector<HTMLElement>('.rep-entry-dialog'),viewport=window.visualViewport;if(dialog&&viewport)return bindRepDialogViewport(dialog,viewport);},[]);
 return null;
}
