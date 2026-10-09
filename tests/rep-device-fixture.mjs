import assert from 'node:assert/strict';
export const cookieHeader=response=>response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
const browsers=new Map();
// Fixture-only explicit manager approval; production never auto-approves a device.
export async function approvedTestLogin(raw,body,adminCookie){
 const browser=browsers.get(body.username)||'';
 let response=await raw(body,browser);
 if(response.status!==200)return response;
 let result=await response.clone().json();
 if(result.deviceApprovalNeeded){
  const deviceCookie=cookieHeader(response);browsers.set(body.username,deviceCookie);
  const origin='http://127.0.0.1:8787';
  const list=await fetch(origin+'/api/rep-devices',{headers:{cookie:adminCookie}});assert.equal(list.status,200);
  const device=(await list.json()).devices.find(d=>d.id.startsWith(result.deviceCode));assert.ok(device);
  const approved=await fetch(origin+'/api/rep-devices',{method:'POST',headers:{origin,cookie:adminCookie,'Content-Type':'application/json'},body:JSON.stringify({action:'approve',id:device.id,status:device.status,reason:'اعتماد جهاز الاختبار'})});assert.equal(approved.status,200,await approved.clone().text());
  response=await raw(body,deviceCookie);
 }
 const device=response.headers.getSetCookie().find(value=>value.startsWith('asad_device='));if(device)browsers.set(body.username,device.split(';')[0]);
 return response;
}
