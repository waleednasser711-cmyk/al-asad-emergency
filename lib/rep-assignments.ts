import {warehouseDocumentAllowed} from './warehouse-access.ts';
// Missing assignments preserve access in existing data and older backups.
export function assignedToRep(entity:{repIds?:string[]}|undefined,repId:string){
 return !!entity&&(entity.repIds===undefined||entity.repIds.includes(repId));
}
export function customerAllowed(state:{customers:any[]},repId:string,customerId:string){
 return assignedToRep(state.customers.find(c=>c.id===customerId),repId);
}
export function documentAllowed(state:{customers:any[]},actor:{id:string,role:string},document:any){
 if(actor.role==='admin')return true;
 if(actor.role==='warehouse')return warehouseDocumentAllowed(state,actor,document);
 if(!document||!(document.actorId===actor.id||document.repId===actor.id||document.location===actor.id))return false;
 if(document.customerId&&document.type!=='purchaseReturn'&&!(document.type==='debt'&&document.entity==='supplier'))return customerAllowed(state,actor.id,document.customerId);
 return true;
}
