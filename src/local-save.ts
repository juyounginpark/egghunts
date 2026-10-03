import {freshSave,parseSave,type Save,type WorldEgg} from './game';
import type {ClockRecord} from './trusted-clock';
export type LocalProfile={version:2;profile:Save;revision:number;updatedAt:number;dirty:boolean;accountId:string|null;clock?:ClockRecord};
export function migrateLegacyProfile(value:unknown,now:number):Save{
 let raw=value;
 if(typeof raw==='string')raw=JSON.parse(raw);
 const source=raw as {profile?:Save;state?:unknown;save?:Save;fields?:Record<string,unknown>}|null;
 if(source?.state)return migrateLegacyProfile(source.state,now);
 const profile=source?.profile??source?.save??raw;
 if(!profile)return freshSave(now);
 if(typeof profile!=='object'||Array.isArray(profile))throw Error('Invalid legacy profile');
 const save={...freshSave(now),...structuredClone(profile)} as Save;
 save.upgrades={...freshSave(now).upgrades,...save.upgrades};
 save.settings={...freshSave(now).settings,...save.settings};
 // Authoritative runtime profiles omit the shared world; create a personal world.
 if(source?.save&&source.fields){
  const f=source.fields;
  if(typeof f.x==='number'&&typeof f.z==='number'&&f.carried){
   save.expedition={deadline:Number(f.deadline)||0,x:f.x,z:f.z,carried:f.carried as WorldEgg,hp:Number(f.hp)||2};
  }
 }
 return parseSave(JSON.stringify(save),now);
}
/** IndexedDB is primary; synchronous mirror protects pagehide and failed transactions. */
export class LocalSaveStore{
 private database:Promise<IDBDatabase>|null=null;
 private open(){
  return this.database??=new Promise<IDBDatabase>((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Local database timed out')),2000);
   const request=indexedDB.open('alkong-local-first',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('profiles');
   request.onsuccess=()=>{clearTimeout(timeout);resolve(request.result);};request.onerror=()=>{clearTimeout(timeout);reject(request.error);};
   request.onblocked=()=>{clearTimeout(timeout);reject(Error('Local database blocked'));};
  });
 }
 private mirrorKey(key:string){return `alkong:local-first:${key}`;}
 async read(key:string):Promise<LocalProfile|null>{
  const mirror=localStorage.getItem(this.mirrorKey(key));
  let dbValue:LocalProfile|null=null;
  try{const db=await this.open();dbValue=await new Promise((resolve,reject)=>{const r=db.transaction('profiles').objectStore('profiles').get(key);r.onsuccess=()=>resolve(r.result??null);r.onerror=()=>reject(r.error);});}catch{/* Mirror remains available. */}
  const mirrorValue=mirror?JSON.parse(mirror) as LocalProfile:null;
  return !dbValue?mirrorValue:mirrorValue&&mirrorValue.updatedAt>=dbValue.updatedAt?mirrorValue:dbValue;
 }
 mirror(key:string,value:LocalProfile){localStorage.setItem(this.mirrorKey(key),JSON.stringify(value));}
 async write(key:string,value:LocalProfile){
  this.mirror(key,value);
  try{const db=await this.open();await new Promise<void>((resolve,reject)=>{const tx=db.transaction('profiles','readwrite');tx.objectStore('profiles').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}catch{/* Synchronous mirror already persisted. */}
 }
 async backup(label:string,value:LocalProfile){await this.write(`backup:${label}:${Date.now()}`,value);}
}
