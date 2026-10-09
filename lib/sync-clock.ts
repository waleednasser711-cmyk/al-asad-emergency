export function createSyncClock(){
 let value='';const listeners=new Set<()=>void>();
 return {getSnapshot:()=>value,subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener)}},publish:(next:string)=>{if(next===value)return;value=next;for(const listener of listeners)listener()}};
}
