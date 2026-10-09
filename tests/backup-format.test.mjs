import assert from 'node:assert/strict';
import {zipSync,strToU8,unzipSync} from 'fflate';
import {blank} from '../lib/business.ts';
import {encode,fingerprint,manifestSchema,verified,MAX_PART} from '../lib/backup-format.ts';
import {manifestEntry,storedZip,zipSize} from '../lib/backup-zip.ts';
import {prepareBackup} from '../lib/client-backups.ts';
const header=encode({state:blank(),accounts:[]}),part={path:'header.json',kind:'header',...await fingerprint(header)},manifest={format:'asad-v2',createdAt:new Date().toISOString(),revision:0,files:[part]};
assert.equal((await fingerprint(new TextEncoder().encode('123456789'))).crc32,0xcbf43926);
const entries=[await manifestEntry(manifest),{...part,body:async()=>new Blob([header]).stream()}];const stream=storedZip(entries),zip=new Uint8Array(await new Response(stream).arrayBuffer());assert.equal(zip.length,zipSize(entries));assert.deepEqual(unzipSync(zip)['header.json'],header);
class BoundedFile extends File{async arrayBuffer(){throw new Error('Whole archive must never be buffered');}}
const prepared=await prepareBackup(new BoundedFile([zip],'new.zip'));assert.deepEqual(prepared.manifest,manifest);await verified(await prepared.part('header.json'),part);
const badIndex=zip.slice(),centralOffset=new DataView(zip.buffer).getUint32(zip.length-6,true);badIndex[centralOffset+16]^=1;await assert.rejects(()=>prepareBackup(new File([badIndex],'bad-index.zip')));
await assert.rejects(()=>verified(Uint8Array.of(1,2),part));await assert.rejects(()=>prepareBackup(new File([zip.slice(0,-10)],'truncated.zip')));
assert.throws(()=>manifestSchema.parse({...manifest,files:[part,part]}));assert.throws(()=>manifestSchema.parse({...manifest,files:[{...part,path:'../secret'}]}));assert.throws(()=>manifestSchema.parse({...manifest,files:[{...part,size:MAX_PART+1}]}));
const legacy=zipSync({'backup.json':strToU8(JSON.stringify({format:'asad-v1',createdAt:manifest.createdAt,state:blank(),images:{}}))});const old=await prepareBackup(new File([legacy],'old.zip'));assert.equal(old.manifest.format,'asad-v2');assert.deepEqual(JSON.parse(new TextDecoder().decode(await old.part('header.json'))).state,blank());
// A broken stream refuses an incomplete stored entry, never silently emitting a valid ZIP.
const broken=storedZip([{path:'header.json',size:header.length+1,crc32:0,body:async()=>new Blob([header]).stream()}]);await assert.rejects(()=>new Response(broken).arrayBuffer());
console.log('PASS: stored streaming ZIP interoperability/size, CRC/SHA, slice-only archive reading, legacy conversion, corrupt/truncated/duplicate/path/oversize rejection');
// A lost final response retries the same restore job, resolving its committed status.
const {restorePrepared}=await import('../lib/client-backups.ts');const realFetch=globalThis.fetch;let commits=0,cancels=0;
globalThis.fetch=async(url,options)=>{if(String(url).includes('path='))return Response.json({ok:true});const body=JSON.parse(options.body);if(body.action==='start')return Response.json({id:'same-job'});if(body.action==='commit'){commits++;assert.equal(body.id,'same-job');if(commits===1)throw new TypeError('Connection lost after commit');return Response.json({ok:true});}if(body.action==='cancel')cancels++;return Response.json({ok:true});};
try{await restorePrepared(prepared,()=>{});assert.equal(commits,2);assert.equal(cancels,0);}finally{globalThis.fetch=realFetch;}
console.log('PASS: lost commit response is resolved by idempotent same-job retry');
