export function bindRepDialogViewport(dialog:HTMLElement,viewport:VisualViewport){
 const update=()=>{dialog.style.setProperty('--rep-viewport-height',viewport.height+'px');dialog.style.setProperty('--rep-viewport-top',viewport.offsetTop+'px');};
 update();viewport.addEventListener('resize',update);viewport.addEventListener('scroll',update);
 return()=>{viewport.removeEventListener('resize',update);viewport.removeEventListener('scroll',update);dialog.style.removeProperty('--rep-viewport-height');dialog.style.removeProperty('--rep-viewport-top');};
}
